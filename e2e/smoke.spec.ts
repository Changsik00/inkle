import { expect, test } from "@playwright/test";

test("첫 화면이 뜨고 HTTP API 로 DB 상태를 읽는다", async ({ page }) => {
  await page.goto("/");
  // 제품 이름은 작게, 화면 제목이 먼저다 (DESIGN.md §Layout).
  await expect(page.getByText("inkle", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "모임을 열 책" })).toBeVisible();
  await expect(page.getByText("DB 연결됨")).toBeVisible();
});

test("엔드포인트 문서를 연다", async ({ request }) => {
  const res = await request.get("/api/openapi.json");
  expect(res.ok()).toBe(true);
  const doc = await res.json();
  expect(Object.keys(doc.paths)).toContain("/health");
});
