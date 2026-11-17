import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ORPCError, onError } from "@orpc/server";
import type { RpcContext } from "@/backend/rpc/context";
import { router } from "@/backend/rpc/router";

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

// Next.js route 파일이 부른다. 계약에 없는 주소는 404.
export async function handleApiRequest(request: Request, context: RpcContext): Promise<Response> {
  const { matched, response } = await handler.handle(request, { prefix: API_PREFIX, context });
  return matched ? response : Response.json({ code: "NOT_FOUND", message: "없는 주소" }, { status: 404 });
}
