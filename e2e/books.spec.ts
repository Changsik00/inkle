import { expect, test } from "@playwright/test";
import { testBookTitle } from "./test-book";

// 실행마다 다른 제목을 써서 이전 실행의 자료와 겹치지 않게 한다.
const title = testBookTitle();

test("책을 등록하면 책 정보로 가고 목록에 나타난다. 같은 책은 다시 만들어지지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "책 등록" }).click();
  await expect(page).toHaveURL("/books/new");

  await page.getByLabel("제목").fill(title);
  await page.getByLabel("작가").fill("시험 작가");
  await page.getByRole("button", { name: "등록" }).click();

  await expect(page).toHaveURL(/\/books\/[0-9a-f-]{36}$/);
  const bookUrl = page.url();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("button", { name: "모임 시작" })).toBeEnabled();

  await page.goto("/");
  await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();

  // 공백과 대소문자만 바꿔 다시 등록
  await page.goto("/books/new");
  await page.getByLabel("제목").fill(`  ${title.toUpperCase()} `);
  await page.getByLabel("작가").fill("시험  작가");
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page.getByText("이미 등록된 책이에요")).toBeVisible();
  await page.getByRole("link", { name: "등록된 책 보기" }).click();
  await expect(page).toHaveURL(bookUrl);
});

test("없는 책 주소는 찾을 수 없다고 알린다", async ({ page }) => {
  await page.goto("/books/00000000-0000-4000-8000-0000000000aa");
  await expect(page.getByText("책을 찾을 수 없어요")).toBeVisible();
});
