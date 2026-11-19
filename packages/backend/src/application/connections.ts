// 연결의 유스케이스 (ADR-002 독자 단위, ADR-004 §7). 내 해석이 저장된 뒤에만 만든다.
// 재료는 그 책의 끝난 수집 가운데 가장 최근 것의 보여 줄 수 있는 배경이다.
import { z } from "zod";
import { ask, newLedger, roundedCost } from "./llm-ask";
import type {
  BookRepository,
  CollectionRepository,
  ConnectionRepository,
  InterpretationRepository,
  JobRepository,
  LlmClient,
  SessionRepository,
} from "./ports";
import * as connect from "./prompts/connect.v1";
import { blocksNewCollection, isShowable } from "../domain/collection";
import { checkConnections, type ConnectionRun } from "../domain/connection";
import { isUuid } from "../domain/id";
import { questionSetById } from "../domain/question-set";
import type { Session } from "../domain/session";

export const CONNECT_BACKGROUND_JOB = "connect-background";

export const connectBackgroundPayload = z.object({ runId: z.string() });

export type EnqueueConnectionsDeps = {
  collections: CollectionRepository;
  interpretations: InterpretationRepository;
  connections: ConnectionRepository;
  jobs: JobRepository;
};

export type EnqueueConnectionsResult =
  | { status: "queued"; runId: string; jobId: number }
  | { status: "exists"; run: ConnectionRun }
  /** 수집이 아직 끝나지 않았다. 끝날 때 다시 넣는다 (enqueueConnectionsForBook) */
  | { status: "waiting_for_collection" }
  | { status: "no_interpretation" };

/**
 * 모임의 최근 판에 대해 연결 만들기를 넣는다. 같은 판·같은 수집으로 끝났거나 진행 중이면 넣지 않는다.
 * 실패했거나 오래 멈췄으면 다시 넣는다 (수집과 같은 규칙).
 */
export async function enqueueConnections(
  deps: EnqueueConnectionsDeps,
  session: Pick<Session, "id" | "bookId">,
  now: Date = new Date(),
): Promise<EnqueueConnectionsResult> {
  const interpretation = await deps.interpretations.latest(session.id);
  if (!interpretation) return { status: "no_interpretation" };
  const collection = await deps.collections.latestForBook(session.bookId);
  if (!collection || collection.status !== "done") return { status: "waiting_for_collection" };

  const latest = await deps.connections.latestRun(session.id, interpretation.version);
  if (latest && latest.collectionId === collection.id && blocksNewCollection(latest, now)) return { status: "exists", run: latest };

  const run = await deps.connections.createRun({
    sessionId: session.id,
    interpretationVersion: interpretation.version,
    collectionId: collection.id,
    promptVersion: connect.version,
  });
  const jobId = await deps.jobs.enqueue(CONNECT_BACKGROUND_JOB, { runId: run.id });
  return { status: "queued", runId: run.id, jobId };
}

/** 수집이 끝나면 그 책의 모든 모임에 연결 만들기를 넣는다. 내 해석이 없는 모임은 건너뛴다. */
export async function enqueueConnectionsForBook(
  deps: EnqueueConnectionsDeps & { sessions: SessionRepository },
  bookId: string,
  now: Date = new Date(),
): Promise<EnqueueConnectionsResult[]> {
  const sessions = await deps.sessions.listByBook(bookId);
  const results: EnqueueConnectionsResult[] = [];
  for (const session of sessions) results.push(await enqueueConnections(deps, session, now));
  return results;
}

// ── 연결 만들기 (작업 처리기 본체)

export type ConnectDeps = {
  books: BookRepository;
  sessions: SessionRepository;
  interpretations: InterpretationRepository;
  collections: CollectionRepository;
  connections: ConnectionRepository;
  llm: LlmClient;
};

export type ConnectResult = { status: "done"; connections: number } | { status: "failed"; error: string } | { status: "skipped" };

export async function connectBackground(deps: ConnectDeps, runId: string): Promise<ConnectResult> {
  const run = isUuid(runId) ? await deps.connections.findRun(runId) : null;
  if (!run || run.status !== "queued") return { status: "skipped" };
  await deps.connections.markRunRunning(run.id);

  const ledger = newLedger();
  const outcome = () => ({ model: [...ledger.models][0] ?? null, costUsd: roundedCost(ledger) });
  const fail = async (error: string): Promise<ConnectResult> => {
    await deps.connections.markRunFailed(run.id, error, outcome());
    return { status: "failed", error };
  };

  try {
    const interpretation = (await deps.interpretations.listVersions(run.sessionId)).find((v) => v.version === run.interpretationVersion);
    if (!interpretation) return await fail("내 해석의 판이 없다");
    const collection = await deps.collections.findById(run.collectionId);
    const book = collection && (await deps.books.findById(collection.bookId));
    if (!book) return await fail("책이 없다");

    const items = (await deps.collections.listBackgroundItems(run.collectionId)).filter(isShowable);
    // 보여 줄 배경이 없으면 이을 것도 없다. 부르지 않고 끝낸다.
    if (items.length === 0) {
      await deps.connections.markRunDone(run.id, outcome());
      return { status: "done", connections: 0 };
    }

    const questions = questionSetById(interpretation.questionSetId)?.questions ?? [];
    const questionText = (id: string) => questions.find((q) => q.id === id)?.text ?? id;
    const labels = items.map((_, i) => `B${i + 1}`);
    const byLabel = new Map(items.map((item, i) => [labels[i], item.id]));

    const prompt = connect.render({
      book,
      answers: interpretation.answers.map((a) => ({ question: questionText(a.questionId), text: a.text })),
      background: items.map((item, i) => ({
        label: labels[i],
        topic: item.topic,
        claimKo: item.claimKo,
        quotes: item.quotes.filter((q) => q.verified).map((q) => ({ text: q.text, translationKo: q.translationKo })),
      })),
    });
    const answer = await ask(deps.llm, ledger, prompt, connect.schema, "none");
    if (!answer.ok) return await fail(`연결 실패: ${answer.error}`);

    const proposed = answer.value.connections.map((c) => ({
      backgroundItemId: byLabel.get(c.background.trim().toUpperCase()) ?? "",
      myQuote: c.my_quote.trim(),
      noteKo: c.note_ko.trim(),
    }));
    const checked = checkConnections(proposed, interpretation.answers, items.map((i) => i.id));
    await deps.connections.addConnections(run.id, run.sessionId, checked);
    await deps.connections.markRunDone(run.id, outcome());
    return { status: "done", connections: checked.filter((c) => c.verified).length };
  } catch (e) {
    return await fail(e instanceof Error ? e.message : String(e));
  }
}
