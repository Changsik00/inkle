// 테스트 전용. 제품 코드에서 부르지 않는다.
import postgres from "postgres";
import type { Sql } from "@/db/client";

const LOCAL_TEST_DATABASE_URL = "postgres://inkle@127.0.0.1:54329/inkle_test";

export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? LOCAL_TEST_DATABASE_URL;
}

export function testSql(): Sql {
  return postgres(testDatabaseUrl(), { max: 5, onnotice: () => {} });
}

// 테스트 데이터베이스를 빈 상태로 되돌린다.
export async function resetTestDatabase(sql: Sql): Promise<void> {
  await sql.unsafe("drop schema public cascade; create schema public;");
}
