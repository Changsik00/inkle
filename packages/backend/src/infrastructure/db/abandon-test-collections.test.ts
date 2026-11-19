import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { enqueueCollection } from "../../application/collection";
import { freshTestDatabase, testSql } from "../../testing/postgres";
import { PostgresBookRepository } from "../repositories/postgres-book-repository";
import { PostgresCollectionRepository } from "../repositories/postgres-collection-repository";
import { PostgresJobRepository } from "../repositories/postgres-job-repository";
import { ABANDONED_ERROR, abandonTestCollections } from "./abandon-test-collections";

const sql = testSql();
const books = new PostgresBookRepository(sql);
const collections = new PostgresCollectionRepository(sql);
const jobs = new PostgresJobRepository(sql);
const PREFIX = "E2E 시험용 책";

beforeEach(async () => {
  await freshTestDatabase(sql);
});

afterAll(async () => {
  await sql.end();
});

async function bookWithQueuedCollection(title: string) {
  const book = await books.create({ title, author: "시험", genre: "fiction", key: `${title}::시험` });
  const queued = await enqueueCollection({ collections, jobs }, book.id);
  if (queued.status !== "queued") throw new Error("수집이 들어가지 않았다");
  return queued;
}

async function jobStatus(id: number) {
  const [row] = await sql<{ status: string; error: string | null }[]>`select status, error from jobs where id = ${id}`;
  return row;
}

describe("abandonTestCollections", () => {
  it("시험용 책의 대기 중인 수집과 그 작업을 실패로 닫는다", async () => {
    const test = await bookWithQueuedCollection(`${PREFIX} 1`);
    const real = await bookWithQueuedCollection("노인과 바다");

    expect(await abandonTestCollections(sql, PREFIX)).toEqual({ collections: 1, jobs: 1 });

    expect(await collections.findById(test.collectionId)).toMatchObject({ status: "failed", error: ABANDONED_ERROR });
    expect(await jobStatus(test.jobId)).toEqual({ status: "failed", error: ABANDONED_ERROR });
    expect(await collections.findById(real.collectionId)).toMatchObject({ status: "queued" });
    expect(await jobStatus(real.jobId)).toMatchObject({ status: "queued" });
  });

  it("진행 중인 수집은 건드리지 않고, 다시 불러도 닫을 것이 없다", async () => {
    const running = await bookWithQueuedCollection(`${PREFIX} 2`);
    await collections.markRunning(running.collectionId);

    expect(await abandonTestCollections(sql, PREFIX)).toEqual({ collections: 0, jobs: 0 });
    expect(await collections.findById(running.collectionId)).toMatchObject({ status: "running" });
  });

  it("너무 짧은 접두어는 거절한다", async () => {
    await expect(abandonTestCollections(sql, " E ")).rejects.toThrow(/너무 짧다/);
  });
});
