import { beforeEach, describe, expect, it } from "vitest";
import { registerBook } from "./books";
import {
  backgroundView,
  CONNECT_BACKGROUND_JOB,
  connectBackground,
  enqueueConnections,
  enqueueConnectionsForBook,
  type ConnectDeps,
  type EnqueueConnectionsDeps,
} from "./connections";
import type { LlmCall } from "./ports";
import * as connect from "./prompts/connect.v1";
import { STALE_AFTER_MS } from "../domain/collection";
import type { Session } from "../domain/session";
import { FakeLlm, type FakeResponder } from "../testing/fakes/llm";
import { InMemoryBookRepository } from "../testing/in-memory/in-memory-book-repository";
import { InMemoryCollectionRepository } from "../testing/in-memory/in-memory-collection-repository";
import { InMemoryConnectionRepository } from "../testing/in-memory/in-memory-connection-repository";
import { InMemoryJobRepository } from "../testing/in-memory/in-memory-job-repository";
import { InMemoryInterpretationRepository, InMemorySessionRepository } from "../testing/in-memory/in-memory-session-repository";

const ME = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const ANSWER = "영혜가 고기를 거부하는 것은 가부장적인 집안에 대한 조용한 저항이라고 읽었다.";

type Deps = ConnectDeps & EnqueueConnectionsDeps & { jobs: InMemoryJobRepository; sessions: InMemorySessionRepository };

let d: Deps;
let bookId: string;
let session: Session;

async function doneCollection(): Promise<{ collectionId: string; shown: string; hidden: string }> {
  const c = await d.collections.create(bookId);
  await d.collections.markRunning(c.id);
  const source = await d.collections.addSource({
    collectionId: c.id,
    bookId,
    url: "https://example.com/interview",
    finalUrl: null,
    who: "작가 본인",
    role: "background",
    fetchStatus: "ok",
    fetchError: null,
    pageText: "본문",
    articleText: "본문",
    readError: null,
  });
  const base = { collectionId: c.id, bookId, sourceId: source.id, model: "m", promptVersion: "read.v1" };
  const shown = await d.collections.addBackgroundItem({
    ...base,
    topic: "author_intent",
    claimKo: "작가는 질문으로 읽어 달라고 했다.",
    quotes: [
      { text: "이 소설을 질문으로 읽어주셨으면 합니다", lang: "ko", translationKo: null, sourceKind: "direct", verified: true },
      { text: "대조에 실패한 인용", lang: "ko", translationKo: null, sourceKind: "direct", verified: false },
    ],
  });
  const hidden = await d.collections.addBackgroundItem({
    ...base,
    topic: "era",
    claimKo: "대조를 통과하지 못한 배경.",
    quotes: [{ text: "없는 문장", lang: "ko", translationKo: null, sourceKind: "editorial", verified: false }],
  });
  await d.collections.markDone(c.id, { models: [], promptVersions: {}, costUsd: 0, candidateCount: 1 });
  return { collectionId: c.id, shown: shown.id, hidden: hidden.id };
}

async function saved(text = ANSWER, s: Session = session) {
  return d.interpretations.appendVersion({ sessionId: s.id, questionSetId: "fiction-v1", answers: [{ questionId: "about", text }] });
}

const connectAnswer =
  (connections: connect.Output["connections"]): FakeResponder =>
  () => ({ connections });

beforeEach(async () => {
  d = {
    books: new InMemoryBookRepository(),
    sessions: new InMemorySessionRepository(),
    interpretations: new InMemoryInterpretationRepository(),
    collections: new InMemoryCollectionRepository(),
    connections: new InMemoryConnectionRepository(),
    jobs: new InMemoryJobRepository(),
    llm: new FakeLlm(connectAnswer([])),
  };
  const r = await registerBook(d.books, { title: "채식주의자", author: "한강" });
  if (r.status !== "created") throw new Error("책 준비 실패");
  bookId = r.book.id;
  session = await d.sessions.create({ userId: ME, bookId });
});

describe("enqueueConnections", () => {
  it("내 해석이 없으면 넣지 않는다", async () => {
    await doneCollection();
    expect(await enqueueConnections(d, session)).toEqual({ status: "no_interpretation" });
  });

  it("수집이 끝나지 않았으면 기다린다", async () => {
    await saved();
    expect(await enqueueConnections(d, session)).toEqual({ status: "waiting_for_collection" });
    await d.collections.create(bookId);
    expect(await enqueueConnections(d, session)).toEqual({ status: "waiting_for_collection" });
    expect(await d.jobs.claimNext()).toBeNull();
  });

  it("최근 판과 최근 끝난 수집으로 연결 만들기를 넣는다. 같은 판·수집으로는 한 번만", async () => {
    const { collectionId } = await doneCollection();
    await saved();
    const r = await enqueueConnections(d, session);
    expect(r).toMatchObject({ status: "queued" });
    expect(await d.jobs.claimNext()).toMatchObject({ kind: CONNECT_BACKGROUND_JOB });
    expect(await d.connections.latestRun(session.id, 1)).toMatchObject({ collectionId, status: "queued", promptVersion: connect.version });
    expect(await enqueueConnections(d, session)).toMatchObject({ status: "exists" });
  });

  it("실패한 것은 다시 넣고, 새 수집이 끝나면 새로 넣는다", async () => {
    await doneCollection();
    await saved();
    const first = await enqueueConnections(d, session);
    if (first.status !== "queued") throw new Error("대기열 실패");
    await d.connections.markRunRunning(first.runId);
    await d.connections.markRunFailed(first.runId, "실패", { model: null, costUsd: 0 });
    expect(await enqueueConnections(d, session)).toMatchObject({ status: "queued" });

    const second = await doneCollection();
    const third = await enqueueConnections(d, session);
    expect(third).toMatchObject({ status: "queued" });
    expect(await d.connections.latestRun(session.id, 1)).toMatchObject({ collectionId: second.collectionId });
  });

  it("enqueueConnectionsForBook 은 그 책의 모든 사용자의 모임에 넣고, 내 해석이 없는 모임은 건너뛴다", async () => {
    const theirs = await d.sessions.create({ userId: OTHER, bookId });
    const empty = await d.sessions.create({ userId: ME, bookId });
    await saved();
    await saved("다른 사용자가 쓴 해석입니다", theirs);
    await doneCollection();
    const results = await enqueueConnectionsForBook(d, bookId);
    expect(results.map((r) => r.status)).toEqual(["queued", "queued", "no_interpretation"]);
    expect(await d.connections.latestRun(empty.id, 1)).toBeNull();
  });
});

describe("connectBackground", () => {
  async function queuedRun() {
    const c = await doneCollection();
    await saved();
    const r = await enqueueConnections(d, session);
    if (r.status !== "queued") throw new Error("대기열 실패");
    return { ...c, runId: r.runId };
  }

  it("보여 줄 수 있는 배경만 넘기고, 내 구절을 대조해 연결을 남긴다", async () => {
    const llm = new FakeLlm(
      connectAnswer([
        { background: " b1 ", my_quote: "가부장적인 집안에 대한 조용한 저항", note_ko: "작가는 질문으로 읽어 달라고 했다." },
        { background: "B9", my_quote: "가부장적인 집안에 대한 조용한 저항", note_ko: "목록에 없는 배경" },
      ]),
      { costUsd: 0.2, model: "model-x" },
    );
    d.llm = llm;
    const { runId, shown, hidden } = await queuedRun();

    expect(await connectBackground(d, runId)).toEqual({ status: "done", connections: 1 });

    const [call] = llm.calls as LlmCall[];
    expect(FakeLlm.stageOf(call)).toBe("connect");
    expect(call.tools).toBe("none");
    expect(call.prompt).toContain(ANSWER);
    expect(call.prompt).toContain("B1 [작가가 밝힌 의도] 작가는 질문으로 읽어 달라고 했다.");
    expect(call.prompt).toContain("이 소설을 질문으로 읽어주셨으면 합니다");
    expect(call.prompt).not.toContain("대조에 실패한 인용");
    expect(call.prompt).not.toContain("대조를 통과하지 못한 배경");
    expect(call.jsonSchema).not.toHaveProperty("$schema");

    expect(await d.connections.listConnections(runId)).toMatchObject([
      { backgroundItemId: shown, questionId: "about", verified: true, noteKo: "작가는 질문으로 읽어 달라고 했다." },
    ]);
    expect(shown).not.toBe(hidden);
    expect(await d.connections.findRun(runId)).toMatchObject({ status: "done", model: "model-x", costUsd: 0.2 });
  });

  it("고쳐 옮긴 구절은 저장하지만 통과하지 못한다", async () => {
    d.llm = new FakeLlm(connectAnswer([{ background: "B1", my_quote: "가부장적인 가정에 대한 조용한 저항", note_ko: "-" }]));
    const { runId } = await queuedRun();
    expect(await connectBackground(d, runId)).toEqual({ status: "done", connections: 0 });
    expect(await d.connections.listConnections(runId)).toMatchObject([{ verified: false, questionId: null }]);
  });

  it("보여 줄 배경이 없으면 LLM 을 부르지 않고 끝난다", async () => {
    const llm = new FakeLlm(connectAnswer([]));
    d.llm = llm;
    const c = await d.collections.create(bookId);
    await d.collections.markRunning(c.id);
    await d.collections.markDone(c.id, { models: [], promptVersions: {}, costUsd: 0, candidateCount: 0 });
    await saved();
    const r = await enqueueConnections(d, session);
    if (r.status !== "queued") throw new Error("대기열 실패");
    expect(await connectBackground(d, r.runId)).toEqual({ status: "done", connections: 0 });
    expect(llm.calls).toHaveLength(0);
  });

  it("형식이 틀리면 한 번 다시 묻고, 두 번 다 실패하면 실패와 이유가 남는다", async () => {
    const llm = new FakeLlm((_, i) => (i === 0 ? { wrong: true } : new Error("CLI 종료 코드 1")));
    d.llm = llm;
    const { runId } = await queuedRun();
    const r = await connectBackground(d, runId);
    expect(r).toMatchObject({ status: "failed", error: expect.stringContaining("CLI 종료 코드 1") });
    expect(llm.calls).toHaveLength(2);
    expect(await d.connections.findRun(runId)).toMatchObject({ status: "failed" });
  });

  it("그 판의 답으로 만든다 (뒤에 새 판이 생겨도)", async () => {
    const llm = new FakeLlm(connectAnswer([]));
    d.llm = llm;
    const { runId } = await queuedRun();
    await saved("나중에 고쳐 쓴 해석입니다");
    await connectBackground(d, runId);
    expect(llm.calls[0].prompt).toContain(ANSWER);
    expect(llm.calls[0].prompt).not.toContain("나중에 고쳐 쓴 해석입니다");
  });

  it("대기 상태가 아니거나 없는 것은 건너뛴다", async () => {
    const { runId } = await queuedRun();
    await connectBackground(d, runId);
    expect(await connectBackground(d, runId)).toEqual({ status: "skipped" });
    expect(await connectBackground(d, "abc")).toEqual({ status: "skipped" });
  });
});

describe("backgroundView", () => {
  it("오래 멈춘 수집과 연결 만들기는 실패로 본다 (다시 모으기를 누를 수 있게)", async () => {
    await saved();
    await d.collections.create(bookId);
    const later = new Date(Date.now() + STALE_AFTER_MS + 1000);
    expect(await backgroundView(d, ME, session.id, later)).toMatchObject({ status: "ok", view: { collection: "failed" } });

    await doneCollection();
    const r = await enqueueConnections(d, session);
    if (r.status !== "queued") throw new Error("대기열 실패");
    expect(await backgroundView(d, ME, session.id)).toMatchObject({ view: { collection: "done", connections: "making" } });
    expect(await backgroundView(d, ME, session.id, later)).toMatchObject({ view: { connections: "failed" } });
  });
});
