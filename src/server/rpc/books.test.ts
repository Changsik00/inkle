import { createRouterClient, type RouterClient } from "@orpc/server";
import { beforeEach, describe, expect, it } from "vitest";
import { AUTHOR_MAX, TITLE_MAX } from "@/domain/book";
import { BOOK_AUTHOR_MAX, BOOK_TITLE_MAX } from "@/http/contract/books";
import type { RpcContext } from "@/server/rpc/context";
import { handleApiRequest } from "@/server/rpc/handler";
import { router } from "@/server/rpc/router";
import { testRpcContext } from "@/testing/rpc";

let context: RpcContext;
let client: RouterClient<typeof router>;

beforeEach(() => {
  context = testRpcContext();
  client = createRouterClient(router, { context });
});

describe("books (처리 함수)", () => {
  it("등록하면 책을 돌려주고 목록에 나타난다", async () => {
    const book = await client.books.register({ title: " 노인과  바다 ", author: "헤밍웨이" });
    expect(book).toMatchObject({ title: "노인과 바다", author: "헤밍웨이", genre: "fiction" });
    expect(typeof book.createdAt).toBe("string");
    expect((await client.books.list()).books.map((b) => b.id)).toEqual([book.id]);
  });

  it("같은 책이면 CONFLICT 와 기존 책", async () => {
    const first = await client.books.register({ title: "채식주의자", author: "한강" });
    await expect(client.books.register({ title: " 채식주의자", author: "한강 " })).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      data: { book: { id: first.id } },
    });
  });

  it("규칙을 어기면 INVALID_BOOK 과 이유", async () => {
    await expect(client.books.register({ title: "  ", author: "한강" })).rejects.toMatchObject({
      code: "INVALID_BOOK",
      status: 400,
      data: { violations: [{ field: "title", reason: "empty" }] },
    });
  });

  it("한 권을 찾는다. 없거나 모양이 틀린 번호는 NOT_FOUND", async () => {
    const book = await client.books.register({ title: "소년이 온다", author: "한강" });
    expect(await client.books.get({ bookId: book.id })).toEqual(book);
    await expect(client.books.get({ bookId: "00000000-0000-4000-8000-0000000000aa" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(client.books.get({ bookId: "abc" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("계약의 길이 제한은 도메인 규칙과 같다", () => {
    expect([BOOK_TITLE_MAX, BOOK_AUTHOR_MAX]).toEqual([TITLE_MAX, AUTHOR_MAX]);
  });
});

describe("books (HTTP)", () => {
  const call = (method: string, path: string, body?: string) =>
    handleApiRequest(
      new Request(`http://inkle.test/api${path}`, {
        method,
        body,
        headers: body ? { "content-type": "application/json" } : undefined,
      }),
      context,
    );

  it("POST /api/books 는 201, 같은 책은 409", async () => {
    const body = JSON.stringify({ title: "노인과 바다", author: "헤밍웨이" });
    expect((await call("POST", "/books", body)).status).toBe(201);
    expect((await call("POST", "/books", body)).status).toBe(409);
  });

  it("GET /api/books 는 200 과 목록", async () => {
    const res = await call("GET", "/books");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ books: [] });
  });

  it("깨진 JSON 이나 빠진 필드는 400", async () => {
    expect((await call("POST", "/books", "{not json")).status).toBe(400);
    expect((await call("POST", "/books", JSON.stringify({ title: "x" }))).status).toBe(400);
  });

  it("없는 책은 404", async () => {
    expect((await call("GET", "/books/00000000-0000-4000-8000-0000000000aa")).status).toBe(404);
  });
});
