import { expect, test } from "@playwright/test";

test("첫 화면이 뜨고 HTTP API 로 DB 상태를 읽는다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "inkle" })).toBeVisible();
  await expect(page.getByText("DB 연결됨")).toBeVisible();
});

test("엔드포인트 문서를 연다", async ({ request }) => {
  const res = await request.get("/api/openapi.json");
  expect(res.ok()).toBe(true);
  const doc = await res.json();
  expect(Object.keys(doc.paths)).toContain("/health");
});
