import postgres from "postgres";
import { databaseUrl } from "@/backend/infrastructure/db/config";

export type Sql = postgres.Sql;

// 개발 모드에서 코드가 다시 불려도 연결을 새로 만들지 않도록 전역에 둔다.
const globalForDb = globalThis as unknown as { __inkleSql?: Sql };

export function getSql(): Sql {
  globalForDb.__inkleSql ??= postgres(databaseUrl(), { max: 5 });
  return globalForDb.__inkleSql;
}
