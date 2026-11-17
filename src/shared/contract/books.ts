import { oc } from "@orpc/contract";
import { z } from "zod";

// 도메인 규칙(src/domain/book.ts)과 같은 값이다. 서버 테스트가 둘이 같은지 확인한다.
export const BOOK_TITLE_MAX = 200;
export const BOOK_AUTHOR_MAX = 100;

export const bookSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  author: z.string(),
  genre: z.enum(["fiction"]),
  createdAt: z.iso.datetime({ offset: true }),
});

export type BookDto = z.infer<typeof bookSchema>;

export const bookViolationSchema = z.object({
  field: z.enum(["title", "author"]),
  reason: z.enum(["empty", "too_long"]),
  max: z.number().optional(),
});

export type BookViolationDto = z.infer<typeof bookViolationSchema>;

export const booksContract = {
  list: oc
    .route({ method: "GET", path: "/books", summary: "등록한 책 목록 (최근 순)" })
    .output(z.object({ books: z.array(bookSchema) })),

  get: oc
    .route({ method: "GET", path: "/books/{bookId}", summary: "책 한 권" })
    .input(z.object({ bookId: z.string() }))
    .errors({ NOT_FOUND: { status: 404, message: "책을 찾을 수 없다" } })
    .output(bookSchema),

  register: oc
    .route({ method: "POST", path: "/books", successStatus: 201, summary: "책 등록 (제목과 작가를 직접 입력)" })
    // 길이와 공백 규칙은 도메인이 판단해 INVALID_BOOK 으로 돌려준다. 여기서는 터무니없이 긴 입력만 막는다.
    .input(z.object({ title: z.string().max(10_000), author: z.string().max(10_000) }))
    .errors({
      CONFLICT: {
        status: 409,
        message: "이미 등록된 책이다",
        data: z.object({ book: bookSchema }),
      },
      INVALID_BOOK: {
        status: 400,
        message: "제목이나 작가가 규칙에 맞지 않는다",
        data: z.object({ violations: z.array(bookViolationSchema) }),
      },
    })
    .output(bookSchema),
};
