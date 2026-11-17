import postgres from "postgres";
import { z } from "zod";
import { DuplicateBookError, type BookRepository, type NewBook } from "@/backend/application/ports";
import { GENRES, type Book } from "@/backend/domain/book";
import type { Sql } from "@/backend/infrastructure/db/client";

const bookRow = z.object({
  id: z.uuid(),
  title: z.string(),
  author: z.string(),
  genre: z.enum(GENRES),
  created_at: z.date(),
});

function toBook(raw: unknown): Book {
  const r = bookRow.parse(raw);
  return { id: r.id, title: r.title, author: r.author, genre: r.genre, createdAt: r.created_at };
}

const UNIQUE_VIOLATION = "23505";

export class PostgresBookRepository implements BookRepository {
  constructor(private readonly sql: Sql) {}

  async create(book: NewBook): Promise<Book> {
    try {
      const [row] = await this.sql`
        insert into books (title, author, genre, key)
        values (${book.title}, ${book.author}, ${book.genre}, ${book.key})
        returning id, title, author, genre, created_at`;
      return toBook(row);
    } catch (e) {
      if (e instanceof postgres.PostgresError && e.code === UNIQUE_VIOLATION) throw new DuplicateBookError(book.key);
      throw e;
    }
  }

  async findById(id: string): Promise<Book | null> {
    const rows = await this.sql`select id, title, author, genre, created_at from books where id = ${id}`;
    return rows.length ? toBook(rows[0]) : null;
  }

  async findByKey(key: string): Promise<Book | null> {
    const rows = await this.sql`select id, title, author, genre, created_at from books where key = ${key}`;
    return rows.length ? toBook(rows[0]) : null;
  }

  async list(): Promise<Book[]> {
    const rows = await this.sql`select id, title, author, genre, created_at from books order by created_at desc, id`;
    return rows.map(toBook);
  }
}
