// 테스트용 BookRepository. 계약 테스트가 Postgres 구현과 같게 붙잡아 둔다.
import { randomUUID } from "node:crypto";
import { DuplicateBookError, type BookRepository, type NewBook } from "../../application/ports";
import type { Book } from "../../domain/book";

export class InMemoryBookRepository implements BookRepository {
  private readonly books: { book: Book; key: string }[] = [];

  async create(input: NewBook): Promise<Book> {
    if (this.books.some((b) => b.key === input.key)) throw new DuplicateBookError(input.key);
    const book: Book = {
      id: randomUUID(),
      title: input.title,
      author: input.author,
      genre: input.genre,
      createdAt: new Date(),
    };
    this.books.push({ book, key: input.key });
    return structuredClone(book);
  }

  async findById(id: string): Promise<Book | null> {
    const found = this.books.find((b) => b.book.id === id);
    return found ? structuredClone(found.book) : null;
  }

  async findByKey(key: string): Promise<Book | null> {
    const found = this.books.find((b) => b.key === key);
    return found ? structuredClone(found.book) : null;
  }

  async list(): Promise<Book[]> {
    // 넣은 순서의 반대가 최근 순이다.
    return this.books.map((b) => structuredClone(b.book)).reverse();
  }
}
