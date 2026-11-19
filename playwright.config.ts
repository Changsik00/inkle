import { defineConfig, devices } from "@playwright/test";

// 흐름 테스트 (ADR-007 §8). compose 로 띄운 실제 앱과 DB 에 대해 돈다.
// 먼저: docker compose up -d --wait
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  // compose 의 개발 서버는 여러 흐름이 동시에 페이지를 처음 컴파일하면 화면 이동이 5초를 넘길 때가 있다 (spec-01-09).
  expect: { timeout: 10_000 },
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
