import { beforeEach, describe, expect, it } from "vitest";
import { createHandlers } from "./handlers";
import { registerBook } from "../application/books";
import { enqueueCollection, type CollectDeps } from "../application/collection";
import { runNextJob } from "../application/jobs";
import { FakeLlm } from "../testing/fakes/llm";
import { FakePageFetcher } from "../testing/fakes/page-fetcher";
import { InMemoryBookRepository } from "../testing/in-memory/in-memory-book-repository";
import { InMemoryCollectionRepository } from "../testing/in-memory/in-memory-collection-repository";
import { InMemoryJobRepository } from "../testing/in-memory/in-memory-job-repository";

let deps: CollectDeps;
let jobs: InMemoryJobRepository;
let bookId: string;

beforeEach(async () => {
  jobs = new InMemoryJobRepository();
  deps = {
    books: new InMemoryBookRepository(),
    collections: new InMemoryCollectionRepository(),
    llm: new FakeLlm(() => ({ candidates: [] })),
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

  it("시험용 noop 도 남아 있다", async () => {
    const id = await jobs.enqueue("noop", {});
    await runNextJob(jobs, createHandlers(deps));
    expect(await jobs.findById(id)).toMatchObject({ status: "done" });
  });
});
