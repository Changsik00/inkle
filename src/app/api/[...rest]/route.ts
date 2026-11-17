// HTTP API 의 입구. 계약(src/http/contract/)에 있는 주소만 처리한다 (ADR-007 §3).
import { container } from "@/server/container";
import { handleApiRequest } from "@/server/rpc/handler";

function handle(request: Request) {
  return handleApiRequest(request, container());
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
