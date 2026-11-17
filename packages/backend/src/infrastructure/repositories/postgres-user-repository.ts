import { z } from "zod";
import type { UserRepository } from "../../application/ports";
import type { User } from "../../domain/user";
import type { Sql } from "../db/client";

const userRow = z.object({
  id: z.uuid(),
  display_name: z.string(),
  created_at: z.date(),
});

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly sql: Sql) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.sql`select id, display_name, created_at from users where id = ${id}`;
    if (rows.length === 0) return null;
    const row = userRow.parse(rows[0]);
    return { id: row.id, displayName: row.display_name, createdAt: row.created_at };
  }
}
