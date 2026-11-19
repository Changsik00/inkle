import { defineConfig, devices } from "@playwright/test";

// 흐름 테스트 (ADR-007 §8). compose 로 띄운 실제 앱과 DB 에 대해 돈다.
// 먼저: docker compose up -d --wait
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  // 시험용 책의 수집을 닫는다 (e2e/test-book.ts). 테스트가 도는 동안에는 작업 프로세스를 띄우지 않는다.
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  // compose 의 개발 서버는 여러 흐름이 동시에 페이지를 처음 컴파일하면 화면 이동이 5초를 넘길 때가 있다 (spec-01-09).
  expect: { timeout: 10_000 },
  // 흐름이 늘면서 한 흐름 전체가 30초(기본)를 넘길 때가 생겼다 (spec-01-10). 대부분 개발 서버의 컴파일을 기다리는 시간이다.
  timeout: 60_000,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
