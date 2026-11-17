// BookRepository 의 계약. 메모리 구현과 Postgres 구현 양쪽에 같은 테스트를 돌린다 (ADR-006 §4).
import { beforeEach, describe, expect, it } from "vitest";
import { DuplicateBookError, type BookRepository } from "../../application/ports";
import { bookKey } from "../../domain/book";

const newBook = (title: string, author: string) => ({ title, author, genre: "fiction" as const, key: bookKey(title, author) });

export function describeBookRepositoryContract(name: string, create: () => Promise<BookRepository>) {
  describe(`BookRepository 계약: ${name}`, () => {
    let books: BookRepository;

    beforeEach(async () => {
      books = await create();
    });

    it("만든 책을 번호로 찾는다", async () => {
      const created = await books.create(newBook("노인과 바다", "어니스트 헤밍웨이"));
      expect(created).toMatchObject({ title: "노인과 바다", author: "어니스트 헤밍웨이", genre: "fiction" });
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(await books.findById(created.id)).toEqual(created);
    });

    it("없는 번호는 null 이다", async () => {
      expect(await books.findById("00000000-0000-4000-8000-0000000000aa")).toBeNull();
    });

    it("정규화한 키로 찾는다", async () => {
      const created = await books.create(newBook("채식주의자", "한강"));
      expect(await books.findByKey(bookKey(" 채식주의자 ", "한강"))).toEqual(created);
      expect(await books.findByKey(bookKey("소년이 온다", "한강"))).toBeNull();
    });

    it("같은 키로 두 번 만들면 DuplicateBookError", async () => {
      await books.create(newBook("채식주의자", "한강"));
      await expect(books.create(newBook("채식주의자", "한강"))).rejects.toBeInstanceOf(DuplicateBookError);
    });

    it("목록은 최근에 등록한 책부터다", async () => {
      const first = await books.create(newBook("첫째", "가"));
      const second = await books.create(newBook("둘째", "나"));
      expect((await books.list()).map((b) => b.id)).toEqual([second.id, first.id]);
    });

    it("책이 없으면 빈 목록이다", async () => {
      expect(await books.list()).toEqual([]);
    });
  });
}
