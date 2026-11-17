import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "@/backend/infrastructure/db/migrate";
import { resetTestDatabase, testSql } from "@/backend/testing/postgres";

const sql = testSql();

beforeEach(async () => {
  await resetTestDatabase(sql);
});

afterAll(async () => {
  await sql.end();
});

describe("migrate", () => {
  it("처음 실행하면 모든 마이그레이션을 적용하고 이름을 돌려준다", async () => {
    const applied = await migrate(sql);
    expect(applied).toContain("0001_init.sql");
    const tables = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables where table_schema = 'public'`;
    expect(tables.map((t) => t.table_name)).toEqual(
      expect.arrayContaining(["schema_migrations", "users", "jobs"]),
    );
  });

  it("두 번 실행해도 한 번만 적용된다", async () => {
    await migrate(sql);
    expect(await migrate(sql)).toEqual([]);
    const [{ count }] = await sql<{ count: number }[]>`
      select count(*)::int as count from schema_migrations where name = '0001_init.sql'`;
    expect(count).toBe(1);
  });

  it("동시에 두 번 실행해도 한 번만 적용된다", async () => {
    const [a, b] = await Promise.all([migrate(sql), migrate(sql)]);
    expect([...a, ...b].filter((n) => n === "0001_init.sql")).toHaveLength(1);
  });
});
