import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { page } from "vitest/browser";
import { BookDetail } from "@/features/books/book-detail";
import { renderWithProviders } from "@/testing/render";
import { bookDto, definedError, SESSION_ID, sessionSummaryDto } from "@/testing/fixtures";
import { test } from "@/testing/test";

test("책 정보를 보여 준다", async ({ worker }) => {
  const book = bookDto();
  worker.use(
    http.get(`/api/books/${book.id}`, () => HttpResponse.json(book)),
    http.get(`/api/books/${book.id}/sessions`, () => HttpResponse.json({ sessions: [] })),
  );
  await renderWithProviders(<BookDetail bookId={book.id} onSessionStarted={() => {}} />);
  await expect.element(page.getByRole("heading", { name: "노인과 바다" })).toBeInTheDocument();
  await expect.element(page.getByText("어니스트 헤밍웨이")).toBeInTheDocument();
  await expect.element(page.getByText("소설")).toBeInTheDocument();
});

test("모임 시작을 누르면 모임을 만들고 그 모임으로 간다", async ({ worker }) => {
  const book = bookDto();
  let posted = 0;
  worker.use(
    http.get(`/api/books/${book.id}`, () => HttpResponse.json(book)),
    http.get(`/api/books/${book.id}/sessions`, () => HttpResponse.json({ sessions: [] })),
    http.post(`/api/books/${book.id}/sessions`, () => {
      posted += 1;
      return HttpResponse.json(sessionSummaryDto(), { status: 201 });
    }),
  );
  const onSessionStarted = vi.fn();
  await renderWithProviders(<BookDetail bookId={book.id} onSessionStarted={onSessionStarted} />);
  await page.getByRole("button", { name: "모임 시작" }).click();
  await expect.poll(() => onSessionStarted.mock.calls.length).toBe(1);
  expect(onSessionStarted).toHaveBeenCalledWith(SESSION_ID);
  expect(posted).toBe(1);
});

test("지난 모임을 단계와 함께 보여 주고 그 모임으로 연결한다", async ({ worker }) => {
  const book = bookDto();
  worker.use(
    http.get(`/api/books/${book.id}`, () => HttpResponse.json(book)),
    http.get(`/api/books/${book.id}/sessions`, () =>
      HttpResponse.json({
        sessions: [
          sessionSummaryDto({ id: "00000000-0000-4000-8000-0000000005e2", stage: "writing" }),
          sessionSummaryDto({ stage: "interpretation_saved" }),
        ],
      }),
    ),
  );
  await renderWithProviders(<BookDetail bookId={book.id} onSessionStarted={() => {}} />);
  await expect.element(page.getByRole("heading", { name: "지난 모임" })).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: /내 해석 저장함/ })).toHaveAttribute("href", `/sessions/${SESSION_ID}/interpretation`);
  await expect.element(page.getByRole("link", { name: /쓰는 중/ })).toBeInTheDocument();
});

test("없는 책이면 찾을 수 없다고 알린다", async ({ worker }) => {
  worker.use(http.get("/api/books/:id", () => HttpResponse.json(definedError("NOT_FOUND", 404), { status: 404 })));
  await renderWithProviders(<BookDetail bookId="00000000-0000-4000-8000-0000000000aa" onSessionStarted={() => {}} />);
  await expect.element(page.getByText("책을 찾을 수 없어요")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "책 목록으로" })).toHaveAttribute("href", "/");
});
