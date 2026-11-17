import { ORPCError } from "@orpc/client";
import { ValidationError } from "@orpc/contract";

// 화면이 받는 오류는 모두 이 모양이다 (ADR-007 §3). 화면은 code 로만 분기한다.
// 계약에 선언한 오류 코드(NOT_FOUND, CONFLICT …)와 아래 네 가지가 있다.
export type ClientErrorCode = "NETWORK_ERROR" | "TIMEOUT" | "ABORTED" | "INVALID_RESPONSE";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  readonly data: unknown;

  constructor(code: string, message: string, options: { status?: number; data?: unknown; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
    this.data = options.data;
  }
}

function isValidationError(e: unknown): boolean {
  return e instanceof ValidationError || (e instanceof Error && e.name === "ValidationError");
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof DOMException && e.name === "TimeoutError") {
    return new ApiError("TIMEOUT", "서버가 제때 답하지 않았다", { cause: e });
  }
  if (e instanceof DOMException && e.name === "AbortError") {
    return new ApiError("ABORTED", "요청을 취소했다", { cause: e });
  }
  if (isValidationError(e)) {
    return new ApiError("INVALID_RESPONSE", "서버의 응답이 약속한 모양과 다르다", { cause: e });
  }
  if (e instanceof ORPCError) {
    // 응답 모양 검사 실패가 ORPCError 로 감싸여 오는 경우
    if (isValidationError(e.cause)) {
      return new ApiError("INVALID_RESPONSE", "서버의 응답이 약속한 모양과 다르다", { cause: e });
    }
    return new ApiError(e.code, e.message, { status: e.status, data: e.data, cause: e });
  }
  if (e instanceof TypeError) {
    return new ApiError("NETWORK_ERROR", "서버에 닿지 못했다", { cause: e });
  }
  return new ApiError("UNKNOWN", e instanceof Error ? e.message : String(e), { cause: e });
}
