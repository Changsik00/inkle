import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { page } from "vitest/browser";
import { BookRegisterForm } from "@/frontend/features/books/book-register-form";
import { renderWithProviders } from "@/frontend/testing/render";
import { bookDto, definedError } from "@/frontend/testing/fixtures";
import { test } from "@/frontend/testing/test";

async function fill(title: string, author: string) {
  await page.getByLabelText("제목").fill(title);
  await page.getByLabelText("작가").fill(author);
  await page.getByRole("button", { name: "등록" }).click();
}

test("장르는 소설로 보여주고 고르지 않는다", async () => {
  await renderWithProviders(<BookRegisterForm onRegistered={() => {}} />);
  await expect.element(page.getByText("장르: 소설")).toBeInTheDocument();
});

test("비어 있으면 서버에 보내지 않고 이유를 보여준다", async ({ worker }) => {
  let posted = 0;
  worker.use(http.post("/api/books", () => void (posted += 1)));
  await renderWithProviders(<BookRegisterForm onRegistered={() => {}} />);
  await fill("   ", "");
  await expect.element(page.getByText("제목을 입력해 주세요")).toBeInTheDocument();
  await expect.element(page.getByText("작가를 입력해 주세요")).toBeInTheDocument();
  expect(posted).toBe(0);
});

test("길이 제한을 넘으면 서버에 보내지 않는다", async ({ worker }) => {
  let posted = 0;
  worker.use(http.post("/api/books", () => void (posted += 1)));
  await renderWithProviders(<BookRegisterForm onRegistered={() => {}} />);
  await fill("가".repeat(201), "한강");
  await expect.element(page.getByText("제목은 200자까지 쓸 수 있어요")).toBeInTheDocument();
  expect(posted).toBe(0);
});

test("등록하면 보낸 값과 함께 등록된 책을 넘긴다", async ({ worker }) => {
  const book = bookDto();
  let body: unknown;
  worker.use(
    http.post("/api/books", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(book, { status: 201 });
    }),
  );
  const onRegistered = vi.fn();
  await renderWithProviders(<BookRegisterForm onRegistered={onRegistered} />);
  await fill("노인과 바다", "어니스트 헤밍웨이");
  await expect.poll(() => onRegistered.mock.calls.length).toBe(1);
  expect(onRegistered).toHaveBeenCalledWith(book);
  expect(body).toEqual({ title: "노인과 바다", author: "어니스트 헤밍웨이" });
});

test("이미 등록된 책이면 그 책으로 가는 안내를 보여준다", async ({ worker }) => {
  const existing = bookDto();
  worker.use(http.post("/api/books", () => HttpResponse.json(definedError("CONFLICT", 409, { book: existing }), { status: 409 })));
  const onRegistered = vi.fn();
  await renderWithProviders(<BookRegisterForm onRegistered={onRegistered} />);
  await fill("노인과  바다", "어니스트 헤밍웨이");
  await expect.element(page.getByText("이미 등록된 책이에요")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "등록된 책 보기" })).toHaveAttribute("href", `/books/${existing.id}`);
  expect(onRegistered).not.toHaveBeenCalled();
});

test("서버가 규칙 위반을 알리면 해당 칸에 이유를 보여준다", async ({ worker }) => {
  worker.use(
    http.post("/api/books", () =>
      HttpResponse.json(definedError("INVALID_BOOK", 400, { violations: [{ field: "author", reason: "too_long", max: 100 }] }), { status: 400 }),
    ),
  );
  await renderWithProviders(<BookRegisterForm onRegistered={() => {}} />);
  await fill("노인과 바다", "헤밍웨이");
  await expect.element(page.getByText("작가는 100자까지 쓸 수 있어요")).toBeInTheDocument();
});

test("그 밖의 오류는 다시 시도하라고 알린다", async ({ worker }) => {
  worker.use(http.post("/api/books", () => new HttpResponse(null, { status: 500 })));
  await renderWithProviders(<BookRegisterForm onRegistered={() => {}} />);
  await fill("노인과 바다", "헤밍웨이");
  await expect.element(page.getByText("등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.")).toBeInTheDocument();
});
