import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import type { RpcContext } from "@/server/rpc/context";
import { router } from "@/server/rpc/router";

export const API_PREFIX = "/api";

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error("[api]", error);
    }),
  ],
});

// Next.js route 파일이 부른다. 계약에 없는 주소는 404.
export async function handleApiRequest(request: Request, context: RpcContext): Promise<Response> {
  const { matched, response } = await handler.handle(request, { prefix: API_PREFIX, context });
  return matched ? response : Response.json({ code: "NOT_FOUND", message: "없는 주소" }, { status: 404 });
}
