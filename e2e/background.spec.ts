import { expect, test } from "@playwright/test";
import { testBookTitle } from "./test-book";

const title = testBookTitle();
const FIRST = "이 책은 결국 무엇에 대한 이야기라고 읽었나요?";

// 작업 프로세스 없이 돈다: 수집은 대기에 머물고, 끝나면 닫힌다 (e2e/test-book.ts). 실제 수집은 spec-01-09 Task 6 에서 손으로 확인했다.
test("내 해석 전에는 배경이 잠기고, 저장하면 배경 화면으로 이어진다", async ({ page }) => {
  await page.goto("/books/new");
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("작가").fill("시험 작가");
  await page.getByRole("button", { name: "등록" }).click();
  await page.getByRole("button", { name: "모임 시작" }).click();
  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}\/interpretation$/);
  const sessionId = page.url().match(/sessions\/([0-9a-f-]{36})/)![1];

  // 문: 화면도 API 도 잠겨 있다
  await page.goto(`/sessions/${sessionId}/background`);
  await expect(page.getByText("내 해석을 먼저 써 주세요. 쓴 뒤에 배경을 볼 수 있어요.")).toBeVisible();
  const locked = await page.request.get(`/api/sessions/${sessionId}/background`);
  expect(locked.status()).toBe(403);
  expect(await locked.text()).not.toContain("collecting");

  await page.getByRole("link", { name: "내 해석 쓰기" }).click();
  await page.getByLabel(FIRST).fill("포기하지 않는 사람의 이야기라고 읽었다");
  await page.getByRole("button", { name: "저장" }).click();
  await page.getByRole("link", { name: "배경 보기" }).click();

  await expect(page).toHaveURL(`/sessions/${sessionId}/background`);
  await expect(page.getByRole("heading", { name: "배경" })).toBeVisible();
  await expect(page.getByText("자료를 모으는 중이에요")).toBeVisible();
  expect((await page.request.get(`/api/sessions/${sessionId}/background`)).status()).toBe(200);
});
