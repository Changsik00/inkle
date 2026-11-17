import type { Sql } from "@/db/client";

export type Health = { db: "ok" | "down" };

export async function checkHealth(sql: Sql): Promise<Health> {
  try {
    await sql`select 1`;
    return { db: "ok" };
  } catch {
    return { db: "down" };
  }
}
