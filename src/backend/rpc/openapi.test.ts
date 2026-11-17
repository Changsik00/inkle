import { describe, expect, it } from "vitest";
import { openApiDocument } from "@/backend/rpc/openapi";

describe("엔드포인트 문서", () => {
  it("계약의 엔드포인트가 모두 문서에 있다", async () => {
    const doc = await openApiDocument();
    const endpoints = Object.entries(doc.paths ?? {}).flatMap(([path, item]) =>
      Object.keys(item ?? {}).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(endpoints.sort()).toEqual(["GET /books", "GET /books/{bookId}", "GET /health", "POST /books"]);
  });

  // 계약이 바뀌면 이 스냅샷이 바뀌어 리뷰에 드러난다 (ADR-007 §3).
  it("문서 스냅샷", async () => {
    expect(await openApiDocument()).toMatchSnapshot();
  });
});
