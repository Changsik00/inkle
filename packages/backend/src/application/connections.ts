// 연결의 유스케이스 (ADR-002 독자 단위, ADR-004 §7). 내 해석이 저장된 뒤에만 만든다.
// 재료는 그 책의 끝난 수집 가운데 가장 최근 것의 보여 줄 수 있는 배경이다.
import { z } from "zod";
import { enqueueCollection } from "./collection";
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
import * as connect from "./prompts/connect.v2";
import { requireUnlocked, type SessionDeps } from "./sessions";
import { blocksNewCollection, isShowable, type BackgroundItem, type BackgroundTopic, type Collection } from "../domain/collection";
import { arrangeBackground, checkConnections, type Connection, type ConnectionRun } from "../domain/connection";
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

// ── 배경 보기 (문을 거친다, ADR-004 §7)

export type CollectionState = "collecting" | "done" | "failed" | "none";
export type ConnectionState = "waiting" | "making" | "done" | "failed";

/** 화면에 내주는 배경 항목: 대조를 통과한 인용만, 출처와 함께 */
export type ShownBackgroundItem = Pick<BackgroundItem, "id" | "topic" | "claimKo" | "quotes"> & { source: { url: string; who: string } };

export type BackgroundView = {
  collection: CollectionState;
  connections: ConnectionState;
  connected: { item: ShownBackgroundItem; connection: Connection & { questionId: string } }[];
  others: { topic: BackgroundTopic; items: ShownBackgroundItem[] }[];
};

/** 멈춘 대기·진행 중은 실패로 본다. 다시 모으기를 누를 수 있게 (blocksNewCollection 과 같은 기준) */
function collectionState(c: Collection | null, now: Date): CollectionState {
  if (!c) return "none";
  if (c.status === "done" || c.status === "failed") return c.status;
  return blocksNewCollection(c, now) ? "collecting" : "failed";
}

function connectionState(run: ConnectionRun | null, collection: Collection | null, now: Date): ConnectionState {
  // 수집이 끝나지 않았거나, 이 수집으로 만든 것이 아직 없다
  if (!collection || collection.status !== "done" || !run || run.collectionId !== collection.id) return "waiting";
  if (run.status === "done" || run.status === "failed") return run.status;
  return blocksNewCollection(run, now) ? "making" : "failed";
}

export async function backgroundView(
  deps: SessionDeps,
  userId: string,
  sessionId: string,
  now: Date = new Date(),
): Promise<{ status: "ok"; view: BackgroundView } | { status: "locked" } | { status: "not_found" }> {
  const gate = await requireUnlocked(deps, userId, sessionId);
  if (gate.status !== "unlocked") return gate;
  const { session, interpretation } = gate;

  const collection = await deps.collections.latestForBook(session.bookId);
  const run = await deps.connections.latestRun(session.id, interpretation.version);
  const view: BackgroundView = {
    collection: collectionState(collection, now),
    connections: connectionState(run, collection, now),
    connected: [],
    others: [],
  };
  if (!collection || collection.status !== "done") return { status: "ok", view };

  const [items, sources] = await Promise.all([deps.collections.listBackgroundItems(collection.id), deps.collections.listSources(collection.id)]);
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const shown: ShownBackgroundItem[] = items.filter(isShowable).map((item) => {
    const source = sourceById.get(item.sourceId);
    return {
      id: item.id,
      topic: item.topic,
      claimKo: item.claimKo,
      quotes: item.quotes.filter((q) => q.verified),
      source: { url: source?.finalUrl ?? source?.url ?? "", who: source?.who ?? "" },
    };
  });
  const connections = view.connections === "done" && run ? await deps.connections.listConnections(run.id) : [];
  const arranged = arrangeBackground(shown, connections);
  view.connected = arranged.connected.flatMap(({ item, connection }) =>
    connection.questionId === null ? [] : [{ item, connection: { ...connection, questionId: connection.questionId } }],
  );
  view.others = arranged.others;
  return { status: "ok", view };
}

/** 그 책의 수집이 실패했거나(멈춤 포함) 없을 때만 다시 넣는다. 끝났거나 모으는 중이면 그대로 둔다. */
export async function recollect(
  deps: SessionDeps,
  userId: string,
  sessionId: string,
  now: Date = new Date(),
): Promise<{ status: "ok"; collection: CollectionState } | { status: "locked" } | { status: "not_found" }> {
  const gate = await requireUnlocked(deps, userId, sessionId);
  if (gate.status !== "unlocked") return gate;
  const r = await enqueueCollection(deps, gate.session.bookId, { now });
  if (r.status === "queued") return { status: "ok", collection: "collecting" };
  return { status: "ok", collection: collectionState(r.collection, now) };
}
