import { z } from "zod";
import type { Sql } from "@/db/client";

// 0001_init.sql 이 넣는 로컬 사용자 (ADR-003).
export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";

const userRow = z.object({
  id: z.uuid(),
  display_name: z.string(),
  created_at: z.date(),
});

export type User = { id: string; displayName: string; createdAt: Date };

// "지금 사용자가 누구인가"를 정하는 유일한 곳 (ADR-003 §4). 인증을 붙일 때 여기만 바꾼다.
export async function currentUser(sql: Sql): Promise<User> {
  const rows = await sql`select id, display_name, created_at from users where id = ${LOCAL_USER_ID}`;
  if (rows.length !== 1) throw new Error("로컬 사용자가 없다. `pnpm db:migrate` 를 실행했는지 확인한다.");
  const row = userRow.parse(rows[0]);
  return { id: row.id, displayName: row.display_name, createdAt: row.created_at };
}
