// API 서버 (ADR-009). 계약(src/shared/contract/)에 있는 주소만 처리한다.
import { createServer, type Server } from "node:http";
import { OpenAPIHandler } from "@orpc/openapi/node";
import { ORPCError, onError } from "@orpc/server";
import type { RpcContext } from "../rpc/context";
import { openApiDocument } from "../rpc/openapi";
import { router } from "../rpc/router";

export const API_PREFIX = "/api";

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      // 계약에 선언한 오류(NOT_FOUND, CONFLICT …)는 정상 응답이라 남기지 않는다.
      if (error instanceof ORPCError && error.defined) return;
      console.error("[api]", error);
    }),
  ],
});

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

/** 요청마다 context() 로 문맥(저장소)을 받는다. 실제로는 container, 테스트에서는 메모리 저장소. */
export function createHttpServer(context: () => RpcContext): Server {
  return createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === `${API_PREFIX}/openapi.json`) {
        return sendJson(res, 200, await openApiDocument());
      }
      const { matched } = await handler.handle(req, res, { prefix: API_PREFIX, context: context() });
      if (!matched) sendJson(res, 404, { code: "NOT_FOUND", message: "없는 주소" });
    } catch (e) {
      console.error("[api]", e);
      if (!res.headersSent) sendJson(res, 500, { code: "INTERNAL_SERVER_ERROR", message: "서버 오류" });
    }
  });
}
