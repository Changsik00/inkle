import { expect, test } from "@playwright/test";
import { testBookTitle } from "./test-book";

const title = testBookTitle();
const FIRST = "이 책은 결국 무엇에 대한 이야기라고 읽었나요?";

test("모임을 열고 내 해석을 쓴다: 임시본, 저장, 고쳐 쓰기, 지난 모임", async ({ page }) => {
  await page.goto("/books/new");
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("작가").fill("시험 작가");
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "모임 시작" }).click();
  await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}\/interpretation$/);
  const sessionUrl = page.url();

  // 임시본: 저장하지 않고 새로고침해도 남는다
  await page.getByLabel(FIRST).fill("포기하지 않는 이야기");
  await page.reload();
  await expect(page.getByLabel(FIRST)).toHaveValue("포기하지 않는 이야기");

  // 저장하면 읽기 모드, 새로고침해도 남는다
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("저장했어요")).toBeVisible();
  await page.reload();
  await expect(page.getByText("포기하지 않는 이야기")).toBeVisible();

  // 고쳐 쓰기 → 판 2
  await page.getByRole("button", { name: "고쳐 쓰기" }).click();
  await page.getByLabel(FIRST).fill("포기하지 않는 이야기, 그래도 현실은 현실");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("판 2")).toBeVisible();

  // /sessions/{id} 는 지금 단계로 보낸다
  await page.goto(sessionUrl.replace(/\/interpretation$/, ""));
  await expect(page).toHaveURL(sessionUrl);

  // 책 정보의 지난 모임
  await page.getByRole("link", { name: /책 정보/ }).click();
  await expect(page.getByRole("link", { name: /내 해석 저장함/ })).toBeVisible();
});
