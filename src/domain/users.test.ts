import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "@/db/migrate";
import { resetTestDatabase, testSql } from "@/db/testing";
import { currentUser, LOCAL_USER_ID } from "@/domain/users";

const sql = testSql();

beforeEach(async () => {
  await resetTestDatabase(sql);
  await migrate(sql);
});

afterAll(async () => {
  await sql.end();
});

describe("users", () => {
  it("마이그레이션 뒤 로컬 사용자가 한 명 있다", async () => {
    const rows = await sql`select id from users`;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(LOCAL_USER_ID);
  });

  it("지금 사용자는 로컬 사용자다", async () => {
    const user = await currentUser(sql);
    expect(user.id).toBe(LOCAL_USER_ID);
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});
