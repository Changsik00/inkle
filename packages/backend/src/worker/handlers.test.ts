import { beforeEach, describe, expect, it } from "vitest";
import { createHandlers, type WorkerDeps } from "./handlers";
import { registerBook } from "../application/books";
import { enqueueCollection } from "../application/collection";
import { runNextJob } from "../application/jobs";
import { FakeLlm } from "../testing/fakes/llm";
import { FakePageFetcher } from "../testing/fakes/page-fetcher";
import { InMemoryBookRepository } from "../testing/in-memory/in-memory-book-repository";
import { InMemoryCollectionRepository } from "../testing/in-memory/in-memory-collection-repository";
import { InMemoryConnectionRepository } from "../testing/in-memory/in-memory-connection-repository";
import { InMemoryJobRepository } from "../testing/in-memory/in-memory-job-repository";
import { InMemoryInterpretationRepository, InMemorySessionRepository } from "../testing/in-memory/in-memory-session-repository";

let deps: WorkerDeps;
let jobs: InMemoryJobRepository;
let bookId: string;

beforeEach(async () => {
  jobs = new InMemoryJobRepository();
  deps = {
    books: new InMemoryBookRepository(),
    sessions: new InMemorySessionRepository(),
    interpretations: new InMemoryInterpretationRepository(),
    collections: new InMemoryCollectionRepository(),
    connections: new InMemoryConnectionRepository(),
    jobs,
    llm: new FakeLlm(() => ({ candidates: [], connections: [] })),
    pages: new FakePageFetcher({}),
  };
  const r = await registerBook(deps.books, { title: "노인과 바다", author: "헤밍웨이" });
  if (r.status !== "created") throw new Error("책 준비 실패");
  bookId = r.book.id;
});

describe("collect-book 처리기", () => {
  it("수집을 돌리고 작업을 끝낸다", async () => {
    const q = await enqueueCollection({ collections: deps.collections, jobs }, bookId);
    if (q.status !== "queued") throw new Error("대기열 실패");
    await runNextJob(jobs, createHandlers(deps));
    expect(await jobs.findById(q.jobId)).toMatchObject({ status: "done" });
    expect(await deps.collections.findById(q.collectionId)).toMatchObject({ status: "done" });
  });

  it("수집이 실패하면 작업도 실패로 남는다", async () => {
    deps.llm = new FakeLlm(() => new Error("로그인 필요"));
    const q = await enqueueCollection({ collections: deps.collections, jobs }, bookId);
    if (q.status !== "queued") throw new Error("대기열 실패");
    await runNextJob(jobs, createHandlers(deps));
    const job = await jobs.findById(q.jobId);
    expect(job?.status).toBe("failed");
    expect(job?.error).toContain("로그인 필요");
  });

  it("작업 내용의 모양이 틀리면 실패", async () => {
    const id = await jobs.enqueue("collect-book", { wrong: 1 });
    await runNextJob(jobs, createHandlers(deps));
    expect(await jobs.findById(id)).toMatchObject({ status: "failed" });
  });

  it("수집이 끝나면 내 해석을 먼저 저장한 모임에 연결 만들기를 넣고, 처리기가 그것을 끝낸다", async () => {
    const session = await deps.sessions.create({ userId: "00000000-0000-4000-8000-000000000001", bookId });
    await deps.interpretations.appendVersion({ sessionId: session.id, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "수집보다 먼저 쓴 해석" }] });
    const q = await enqueueCollection({ collections: deps.collections, jobs }, bookId);
    if (q.status !== "queued") throw new Error("대기열 실패");
    const handlers = createHandlers(deps);
    await runNextJob(jobs, handlers);
    const run = await deps.connections.latestRun(session.id, 1);
    expect(run).toMatchObject({ status: "queued", collectionId: q.collectionId });
    await runNextJob(jobs, handlers);
    expect(await deps.connections.findRun(run!.id)).toMatchObject({ status: "done" });
  });

  it("없는 연결 만들기는 건너뛰고, 모양이 틀린 작업은 실패로 남는다", async () => {
    const id = await jobs.enqueue("connect-background", { runId: "00000000-0000-4000-8000-0000000000ee" });
    await runNextJob(jobs, createHandlers(deps));
    expect(await jobs.findById(id)).toMatchObject({ status: "done" });
    const bad = await jobs.enqueue("connect-background", { wrong: 1 });
    await runNextJob(jobs, createHandlers(deps));
    expect(await jobs.findById(bad)).toMatchObject({ status: "failed" });
  });

  it("시험용 noop 도 남아 있다", async () => {
    const id = await jobs.enqueue("noop", {});
    await runNextJob(jobs, createHandlers(deps));
    expect(await jobs.findById(id)).toMatchObject({ status: "done" });
  });
});
