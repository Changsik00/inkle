import { getBook, listBooks, registerBook } from "@/application/books";
import type { Book } from "@/domain/book";
import type { BookDto } from "@/http/contract/books";
import { os } from "@/server/rpc/os";

function toDto(book: Book): BookDto {
  return { ...book, createdAt: book.createdAt.toISOString() };
}

export const books = {
  list: os.books.list.handler(async ({ context }) => ({
    books: (await listBooks(context.books)).map(toDto),
  })),

  get: os.books.get.handler(async ({ context, input, errors }) => {
    const book = await getBook(context.books, input.bookId);
    if (!book) throw errors.NOT_FOUND();
    return toDto(book);
  }),

  register: os.books.register.handler(async ({ context, input, errors }) => {
    const result = await registerBook(context.books, input);
    switch (result.status) {
      case "created":
        return toDto(result.book);
      case "exists":
        throw errors.CONFLICT({ data: { book: toDto(result.book) } });
      case "invalid":
        throw errors.INVALID_BOOK({ data: { violations: result.violations } });
    }
  }),
};
