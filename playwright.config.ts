import { defineConfig, devices } from "@playwright/test";

// 흐름 테스트 (ADR-007 §8). compose 로 띄운 실제 앱과 DB 에 대해 돈다.
// 먼저: docker compose up -d --wait
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
