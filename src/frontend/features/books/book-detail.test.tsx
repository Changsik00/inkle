import { http, HttpResponse } from "msw";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { BookDetail } from "@/frontend/features/books/book-detail";
import { renderWithProviders } from "@/frontend/testing/render";
import { bookDto, definedError } from "@/frontend/testing/fixtures";
import { test } from "@/frontend/testing/test";

test("책 정보를 보여주고 모임 시작은 아직 누를 수 없다", async ({ worker }) => {
  const book = bookDto();
  worker.use(http.get(`/api/books/${book.id}`, () => HttpResponse.json(book)));
  await renderWithProviders(<BookDetail bookId={book.id} />);
  await expect.element(page.getByRole("heading", { name: "노인과 바다" })).toBeInTheDocument();
  await expect.element(page.getByText("어니스트 헤밍웨이")).toBeInTheDocument();
  await expect.element(page.getByText("소설")).toBeInTheDocument();
  await expect.element(page.getByRole("button", { name: "모임 시작" })).toBeDisabled();
});

test("없는 책이면 찾을 수 없다고 알린다", async ({ worker }) => {
  worker.use(http.get("/api/books/:id", () => HttpResponse.json(definedError("NOT_FOUND", 404), { status: 404 })));
  await renderWithProviders(<BookDetail bookId="00000000-0000-4000-8000-0000000000aa" />);
  await expect.element(page.getByText("책을 찾을 수 없어요")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "책 목록으로" })).toHaveAttribute("href", "/");
});
