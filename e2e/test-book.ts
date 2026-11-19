import { execFileSync } from "node:child_process";

// 흐름 테스트가 등록하는 책의 제목은 모두 이 말로 시작한다.
// 끝나면 이 책들의 대기 중인 수집을 닫는다 (`pnpm e2e:abandon`): 작업 프로세스가 가짜 책을 실제로 모으지 않도록.
export const TEST_BOOK_PREFIX = "E2E 시험용 책";

export const testBookTitle = () => `${TEST_BOOK_PREFIX} ${Date.now()}`;

/** 개발 DB 에서 시험용 책의 대기 중인 수집을 실패로 닫는다. */
export function abandonTestCollections(): void {
  execFileSync("pnpm", ["--silent", "e2e:abandon", TEST_BOOK_PREFIX], { stdio: "inherit" });
}
