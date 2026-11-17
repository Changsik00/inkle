import { http, HttpResponse } from "msw";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { BookList } from "@/features/books/book-list";
import { renderWithProviders } from "@/testing/render";
import { bookDto } from "@/testing/fixtures";
import { test } from "@/testing/test";

test("책이 없으면 등록을 안내한다", async ({ worker }) => {
  worker.use(http.get("/api/books", () => HttpResponse.json({ books: [] })));
  await renderWithProviders(<BookList />);
  await expect.element(page.getByText("아직 등록한 책이 없어요")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "첫 책 등록하기" })).toHaveAttribute("href", "/books/new");
});

test("등록한 책을 제목, 작가, 장르와 함께 보여주고 책 정보로 연결한다", async ({ worker }) => {
  const book = bookDto();
  worker.use(http.get("/api/books", () => HttpResponse.json({ books: [book, bookDto({ id: "00000000-0000-4000-8000-000000000b02", title: "채식주의자", author: "한강" })] })));
  await renderWithProviders(<BookList />);
  const link = page.getByRole("link", { name: /노인과 바다/ });
  await expect.element(link).toHaveAttribute("href", `/books/${book.id}`);
  await expect.element(link.getByText("어니스트 헤밍웨이 · 소설")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: /채식주의자/ })).toBeInTheDocument();
});

test("목록을 불러오지 못하면 알리고 다시 시도할 수 있다", async ({ worker }) => {
  let calls = 0;
  worker.use(
    http.get("/api/books", () => {
      calls += 1;
      return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ books: [bookDto()] });
    }),
  );
  await renderWithProviders(<BookList />);
  await expect.element(page.getByText("책 목록을 불러오지 못했어요")).toBeInTheDocument();
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect.element(page.getByRole("link", { name: /노인과 바다/ })).toBeInTheDocument();
});
