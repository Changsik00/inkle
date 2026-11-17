import { DuplicateBookError, type BookRepository } from "./ports";
import { bookKey, isBookId, validateBookInput, type Book, type BookViolation } from "../domain/book";

export type RegisterBookResult =
  | { status: "created"; book: Book }
  | { status: "exists"; book: Book }
  | { status: "invalid"; violations: BookViolation[] };

// 책을 등록한다. 같은 책이 있으면 새로 만들지 않고 기존 책을 돌려준다 (ADR-002: 책 단위 자료의 재사용).
export async function registerBook(
  books: BookRepository,
  input: { title: string; author: string },
): Promise<RegisterBookResult> {
  const checked = validateBookInput(input);
  if (!checked.ok) return { status: "invalid", violations: checked.violations };

  const { title, author } = checked.value;
  const key = bookKey(title, author);
  const existing = await books.findByKey(key);
  if (existing) return { status: "exists", book: existing };

  try {
    return { status: "created", book: await books.create({ title, author, genre: "fiction", key }) };
  } catch (e) {
    // 확인과 저장 사이에 다른 요청이 같은 책을 만들었다.
    if (!(e instanceof DuplicateBookError)) throw e;
    const winner = await books.findByKey(key);
    if (!winner) throw e;
    return { status: "exists", book: winner };
  }
}

export function listBooks(books: BookRepository): Promise<Book[]> {
  return books.list();
}

export async function getBook(books: BookRepository, id: string): Promise<Book | null> {
  return isBookId(id) ? books.findById(id) : null;
}
