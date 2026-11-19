// 흐름 테스트(E2E)가 남긴 시험용 책의 대기 중인 수집을 닫는다: `pnpm e2e:abandon <제목 접두어>`
// Playwright 가 시작과 끝에 부른다 (e2e/test-book.ts). 개발 DB 의 인프라 일이라 container 를 거치지 않는다.
import { getSql } from "@inkle/backend/db";
import { abandonTestCollections } from "@inkle/backend/db/abandon-test-collections";

async function main() {
  const prefix = process.argv[2];
  if (!prefix) throw new Error("사용법: pnpm e2e:abandon <시험용 책 제목의 접두어>");
  const sql = getSql();
  try {
    const n = await abandonTestCollections(sql, prefix);
    if (n.collections) console.log(`시험용 책의 대기 중인 수집 ${n.collections}개, 작업 ${n.jobs}개를 닫음`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
