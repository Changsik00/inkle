// API 서버를 실제로 띄워 HTTP 로 부른다. 저장소는 메모리 구현이다.
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHttpServer } from "./http-server";
import { testRpcContext } from "../testing/rpc";

let server: Server;
let base: string;

async function start(options: { dbReachable?: boolean } = {}) {
  // 한 서버가 같은 저장소를 계속 쓴다 (실제 container 와 같다).
  const context = testRpcContext(options);
  server = createHttpServer(() => context);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeEach(() => start());

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const post = (path: string, body: string) =>
  fetch(`${base}/api${path}`, { method: "POST", body, headers: { "content-type": "application/json" } });

describe("API 서버", () => {
  it("GET /api/health 는 200", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ db: "ok" });
  });

  it("DB 에 닿지 못하면 /api/health 는 503", async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await start({ dbReachable: false });
    expect((await fetch(`${base}/api/health`)).status).toBe(503);
  });

  it("POST /api/books 는 201, 같은 책은 409 와 기존 책", async () => {
    const body = JSON.stringify({ title: "노인과 바다", author: "헤밍웨이" });
    const first = await post("/books", body);
    expect(first.status).toBe(201);
    const created = (await first.json()) as { id: string };
    const again = await post("/books", body);
    expect(again.status).toBe(409);
    expect(await again.json()).toMatchObject({ code: "CONFLICT", data: { book: { id: created.id } } });
  });

  it("GET /api/books 와 /api/books/{bookId}", async () => {
    const created = (await (await post("/books", JSON.stringify({ title: "채식주의자", author: "한강" }))).json()) as { id: string };
    expect(await (await fetch(`${base}/api/books`)).json()).toMatchObject({ books: [{ id: created.id }] });
    expect((await fetch(`${base}/api/books/${created.id}`)).status).toBe(200);
    expect((await fetch(`${base}/api/books/00000000-0000-4000-8000-0000000000aa`)).status).toBe(404);
  });

  it("규칙 위반, 깨진 JSON, 빠진 필드는 400", async () => {
    expect((await post("/books", JSON.stringify({ title: " ", author: "x" }))).status).toBe(400);
    expect((await post("/books", "{not json")).status).toBe(400);
    expect((await post("/books", JSON.stringify({ title: "x" }))).status).toBe(400);
  });

  it("GET /api/openapi.json 은 엔드포인트 문서", async () => {
    const res = await fetch(`${base}/api/openapi.json`);
    expect(res.status).toBe(200);
    expect(Object.keys(((await res.json()) as { paths: object }).paths)).toEqual(expect.arrayContaining(["/health", "/books", "/books/{bookId}"]));
  });

  it("계약에 없는 주소는 404", async () => {
    expect((await fetch(`${base}/api/nope`)).status).toBe(404);
    expect((await fetch(`${base}/elsewhere`)).status).toBe(404);
  });
});
