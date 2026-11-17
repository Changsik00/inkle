import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Sql } from "@/infrastructure/db/client";

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "infrastructure", "db", "migrations");

// 여러 프로세스가 동시에 실행해도 한 번만 적용되도록 잡는 잠금의 번호. 값 자체에는 뜻이 없다.
const MIGRATION_LOCK_KEY = 4_651_201;

// 번호가 붙은 SQL 파일을 이름 순서대로, 아직 적용하지 않은 것만 적용한다.
// 적용한 파일 이름을 돌려준다.
export async function migrate(sql: Sql, dir = MIGRATIONS_DIR): Promise<string[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  return sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`;
    await tx`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )`;
    const done = new Set(
      (await tx<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name),
    );

    const applied: string[] = [];
    for (const file of files) {
      if (done.has(file)) continue;
      await tx.unsafe(await readFile(path.join(dir, file), "utf8"));
      await tx`insert into schema_migrations (name) values (${file})`;
      applied.push(file);
    }
    return applied;
  });
}
