// 테스트 전용. 제품 코드에서 부르지 않는다.
const LOCAL_TEST_DATABASE_URL = "postgres://inkle@127.0.0.1:54329/inkle_test";

export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? LOCAL_TEST_DATABASE_URL;
}
