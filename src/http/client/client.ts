import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { ResponseValidationPlugin } from "@orpc/contract/plugins";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { contract } from "@/http/contract";
import { toApiError } from "@/http/client/api-error";

export type ApiClient = JsonifiedClient<ContractRouterClient<typeof contract>>;

export type ApiClientOptions = {
  /** 생략하면 브라우저의 현재 주소를 쓴다. Node(테스트)에서는 꼭 준다. */
  origin?: string;
  fetch?: typeof fetch;
  /** 요청 하나의 시간 제한 */
  timeoutMs?: number;
  headers?: Record<string, string>;
};

const DEFAULT_TIMEOUT_MS = 15_000;

// 화면이 서버를 부르는 유일한 통로 (ADR-007 §3).
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseFetch = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const link = new OpenAPILink(contract, {
    url: `${options.origin ?? (typeof window === "undefined" ? "http://localhost" : window.location.origin)}/api`,
    headers: { accept: "application/json", ...options.headers },
    fetch: (request, init) => {
      const timeout = AbortSignal.timeout(timeoutMs);
      // 호출하는 쪽의 취소 신호는 Request 에 실려 온다. 시간 제한과 합친다.
      const signal = AbortSignal.any([request.signal, timeout]);
      return baseFetch(new Request(request, { signal }), init);
    },
    plugins: [new ResponseValidationPlugin(contract)],
  });

  return withErrorNormalization(createORPCClient(link));
}

// 모든 호출의 오류를 ApiError 로 바꾼다. 클라이언트는 경로마다 함수인 중첩 객체라 Proxy 로 감싼다.
function withErrorNormalization<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, key, receiver) {
      const value = Reflect.get(obj, key, receiver);
      return typeof value === "function" || (typeof value === "object" && value !== null)
        ? withErrorNormalization(value)
        : value;
    },
    apply(fn, thisArg, args) {
      try {
        const result = Reflect.apply(fn as (...a: unknown[]) => unknown, thisArg, args);
        return result instanceof Promise ? result.catch((e) => Promise.reject(toApiError(e))) : result;
      } catch (e) {
        throw toApiError(e);
      }
    },
  });
}
