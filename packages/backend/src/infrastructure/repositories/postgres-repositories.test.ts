import { afterAll, describe, expect, it } from "vitest";
import { registerBook } from "../../application/books";
import { PostgresBookRepository } from "./postgres-book-repository";
import { PostgresCollectionRepository } from "./postgres-collection-repository";
import { PostgresConnectionRepository } from "./postgres-connection-repository";
import { PostgresInterpretationRepository, PostgresSessionRepository } from "./postgres-session-repository";
import { PostgresHealthProbe } from "./postgres-health-probe";
import { PostgresJobRepository } from "./postgres-job-repository";
import { PostgresUserRepository } from "./postgres-user-repository";
import { describeBookRepositoryContract } from "../../testing/contracts/book-repository.contract";
import { describeCollectionRepositoryContract, sourceInput } from "../../testing/contracts/collection-repository.contract";
import { describeConnectionRepositoryContract } from "../../testing/contracts/connection-repository.contract";
import { describeJobRepositoryContract } from "../../testing/contracts/job-repository.contract";
import { describeSessionRepositoryContract, type SessionFixture } from "../../testing/contracts/session-repository.contract";
import { describeUserRepositoryContract } from "../../testing/contracts/user-repository.contract";
import { freshTestDatabase, testSql } from "../../testing/postgres";
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

const OTHER_USER = "00000000-0000-4000-8000-000000000002";

async function sessionFixture(): Promise<SessionFixture> {
  await freshTestDatabase(sql);
  await sql`insert into users (id, display_name) values (${OTHER_USER}, '다른 사용자')`;
  const books = new PostgresBookRepository(sql);
  const make = async (title: string) => (await registerBook(books, { title, author: "시험" })).status === "created";
  await make("첫째 책");
  await make("둘째 책");
  const [first, second] = (await books.list()).reverse();
  return {
    sessions: new PostgresSessionRepository(sql),
    interpretations: new PostgresInterpretationRepository(sql),
    userId: "00000000-0000-4000-8000-000000000001",
    otherUserId: OTHER_USER,
    bookId: first.id,
    otherBookId: second.id,
  };
}

describeSessionRepositoryContract("Postgres", sessionFixture);

describeCollectionRepositoryContract("Postgres", async () => {
  const f = await sessionFixture();
  return { collections: new PostgresCollectionRepository(sql), bookId: f.bookId, otherBookId: f.otherBookId };
});

describeConnectionRepositoryContract("Postgres", async () => {
  const f = await sessionFixture();
  const session = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
  for (const text of ["첫째 판", "둘째 판"]) {
    await f.interpretations.appendVersion({ sessionId: session.id, questionSetId: "fiction-v1", answers: [{ questionId: "q1", text }] });
  }
  const collections = new PostgresCollectionRepository(sql);
  const collection = await collections.create(f.bookId);
  const other = await collections.create(f.bookId);
  const source = await collections.addSource(sourceInput(collection.id, f.bookId));
  const item = () =>
    collections.addBackgroundItem({
      collectionId: collection.id,
      bookId: f.bookId,
      sourceId: source.id,
      topic: "era",
      claimKo: "배경 설명",
      model: "model-a",
      promptVersion: "read.v1",
      quotes: [],
    });
  const [a, b] = [await item(), await item()];
  return {
    connections: new PostgresConnectionRepository(sql),
    sessionId: session.id,
    collectionId: collection.id,
    otherCollectionId: other.id,
    backgroundItemIds: [a.id, b.id],
  };
});

describe("내 해석 판의 동시성", () => {
  it("같은 모임에 동시에 저장해도 판 번호가 겹치지 않는다", async () => {
    const f = await sessionFixture();
    const s = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
    const saved = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        f.interpretations.appendVersion({ sessionId: s.id, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: String(i) }] }),
      ),
    );
    expect(saved.map((v) => v.version).sort()).toEqual([1, 2, 3, 4, 5]);
  });
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

describe("시선의 종류 제약 (0006)", () => {
  it("출처 없는 시선은 AI 가 만든 해석일 때만, 그때 흔함 정도는 알 수 없음만", async () => {
    const f = await sessionFixture();
    const collections = new PostgresCollectionRepository(sql);
    const c = await collections.create(f.bookId);
    const s = await collections.addSource(sourceInput(c.id, f.bookId));
    const insert = (kind: string, sourceId: string | null, who: string | null, role: string | null, prevalence = "unknown") =>
      sql`insert into perspectives (collection_id, book_id, source_id, kind, who, role, reading_ko, prevalence, model, prompt_version)
          values (${c.id}, ${f.bookId}, ${sourceId}, ${kind}, ${who}, ${role}, '읽기', ${prevalence}, 'm', 'v')`;

    await expect(insert("external", null, null, null)).rejects.toThrow(/perspectives_kind_shape/);
    await expect(insert("imagined", s.id, "누구", "critic")).rejects.toThrow(/perspectives_kind_shape/);
    await expect(insert("imagined", null, null, null, "majority")).rejects.toThrow(/perspectives_kind_shape/);
    await insert("imagined", null, null, null);
    await insert("external", s.id, "평론가", "critic", "rare");
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
