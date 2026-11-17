import { afterAll, describe, expect, it } from "vitest";
import { registerBook } from "@/application/books";
import { PostgresBookRepository } from "@/infrastructure/repositories/postgres-book-repository";
import { PostgresHealthProbe } from "@/infrastructure/repositories/postgres-health-probe";
import { PostgresJobRepository } from "@/infrastructure/repositories/postgres-job-repository";
import { PostgresUserRepository } from "@/infrastructure/repositories/postgres-user-repository";
import { describeBookRepositoryContract } from "@/testing/contracts/book-repository.contract";
import { describeJobRepositoryContract } from "@/testing/contracts/job-repository.contract";
import { describeUserRepositoryContract } from "@/testing/contracts/user-repository.contract";
import { freshTestDatabase, testSql } from "@/testing/postgres";
import postgres from "postgres";

const sql = testSql();

afterAll(async () => {
  await sql.end();
});

describeJobRepositoryContract("Postgres", async () => {
  await freshTestDatabase(sql);
  return new PostgresJobRepository(sql);
});

describeUserRepositoryContract("Postgres", async () => {
  await freshTestDatabase(sql);
  return new PostgresUserRepository(sql);
});

describeBookRepositoryContract("Postgres", async () => {
  await freshTestDatabase(sql);
  return new PostgresBookRepository(sql);
});

describe("책 등록의 동시성", () => {
  it("같은 책을 동시에 등록해도 하나만 생기고 나머지는 기존 책을 받는다", async () => {
    await freshTestDatabase(sql);
    const books = new PostgresBookRepository(sql);
    const results = await Promise.all(
      Array.from({ length: 4 }, () => registerBook(books, { title: "노인과 바다", author: "헤밍웨이" })),
    );
    expect(results.filter((r) => r.status === "created")).toHaveLength(1);
    expect(results.filter((r) => r.status === "exists")).toHaveLength(3);
    expect(await books.list()).toHaveLength(1);
  });
});

// 계약에 넣지 않은 Postgres 고유의 성질. 메모리 구현은 한 프로세스 안에서만 쓰므로 해당하지 않는다.
describe("PostgresJobRepository 의 동시성", () => {
  it("동시에 두 번 가져가도 같은 작업을 둘이 잡지 않는다", async () => {
    await freshTestDatabase(sql);
    const jobs = new PostgresJobRepository(sql);
    await jobs.enqueue("noop", {});
    const results = await Promise.all([jobs.claimNext(), jobs.claimNext()]);
    expect(results.filter((r): boolean => r !== null)).toHaveLength(1);
  });

  it("작업이 둘이면 동시에 가져갈 때 서로 다른 작업을 잡는다", async () => {
    await freshTestDatabase(sql);
    const jobs = new PostgresJobRepository(sql);
    await jobs.enqueue("noop", {});
    await jobs.enqueue("noop", {});
    const [a, b] = await Promise.all([jobs.claimNext(), jobs.claimNext()]);
    expect(a && b && a.id !== b.id).toBe(true);
  });
});

describe("PostgresHealthProbe", () => {
  it("DB 에 닿으면 true", async () => {
    expect(await new PostgresHealthProbe(sql).isDatabaseReachable()).toBe(true);
  });

  it("DB 에 닿지 못하면 예외 없이 false", async () => {
    // 아무도 듣지 않는 포트. 연결이 바로 거부된다.
    const dead = postgres("postgres://inkle@127.0.0.1:1/inkle", { max: 1, connect_timeout: 2 });
    try {
      expect(await new PostgresHealthProbe(dead).isDatabaseReachable()).toBe(false);
    } finally {
      await dead.end({ timeout: 1 });
    }
  });
});
