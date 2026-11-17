import { beforeEach, describe, expect, it } from "vitest";
import { getBook, listBooks, registerBook } from "@/backend/application/books";
import { DuplicateBookError, type BookRepository } from "@/backend/application/ports";
import { InMemoryBookRepository } from "@/backend/testing/in-memory/in-memory-book-repository";

let books: InMemoryBookRepository;

beforeEach(() => {
  books = new InMemoryBookRepository();
});

describe("registerBook", () => {
  it("다듬은 제목과 작가로 소설을 등록한다", async () => {
    const result = await registerBook(books, { title: "  노인과   바다 ", author: " 헤밍웨이 " });
    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.book).toMatchObject({ title: "노인과 바다", author: "헤밍웨이", genre: "fiction" });
  });

  it("공백과 대소문자만 다른 같은 책은 새로 만들지 않고 기존 책을 돌려준다", async () => {
    const first = await registerBook(books, { title: "The Vegetarian", author: "Han Kang" });
    const again = await registerBook(books, { title: " the  vegetarian ", author: "HAN KANG" });
    expect(again.status).toBe("exists");
    if (first.status !== "created" || again.status !== "exists") return;
    expect(again.book.id).toBe(first.book.id);
    expect(await books.list()).toHaveLength(1);
  });

  it("규칙을 어기면 이유와 함께 거부하고 저장하지 않는다", async () => {
    const result = await registerBook(books, { title: "", author: "가".repeat(101) });
    expect(result).toEqual({
      status: "invalid",
      violations: [
        { field: "title", reason: "empty" },
        { field: "author", reason: "too_long", max: 100 },
      ],
    });
    expect(await books.list()).toEqual([]);
  });

  it("확인과 저장 사이에 다른 요청이 같은 책을 먼저 만들면 기존 책을 돌려준다", async () => {
    // 처음 확인할 때는 없었는데, 만들려고 하니 다른 요청이 먼저 만들어 둔 상황
    const inner = new InMemoryBookRepository();
    let checked = false;
    const racing: BookRepository = {
      list: () => inner.list(),
      findById: (id) => inner.findById(id),
      findByKey: async (key) => {
        if (!checked) {
          checked = true;
          return null;
        }
        return inner.findByKey(key);
      },
      create: async (book) => {
        await inner.create(book);
        throw new DuplicateBookError(book.key);
      },
    };
    const result = await registerBook(racing, { title: "소년이 온다", author: "한강" });
    expect(result.status).toBe("exists");
  });
});

describe("listBooks, getBook", () => {
  it("목록과 한 권을 돌려준다", async () => {
    const created = await registerBook(books, { title: "소년이 온다", author: "한강" });
    if (created.status !== "created") throw new Error("등록 실패");
    expect((await listBooks(books)).map((b) => b.id)).toEqual([created.book.id]);
    expect(await getBook(books, created.book.id)).toEqual(created.book);
  });

  it("없는 책이나 모양이 틀린 번호는 null", async () => {
    expect(await getBook(books, "00000000-0000-4000-8000-0000000000aa")).toBeNull();
    expect(await getBook(books, "abc")).toBeNull();
  });
});
