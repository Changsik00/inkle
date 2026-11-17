import type { HealthProbe } from "@/application/ports";
import type { Sql } from "@/infrastructure/db/client";

export class PostgresHealthProbe implements HealthProbe {
  constructor(private readonly sql: Sql) {}

  async isDatabaseReachable(): Promise<boolean> {
    try {
      await this.sql`select 1`;
      return true;
    } catch {
      return false;
    }
  }
}
