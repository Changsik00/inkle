import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/http/client/api-error";

// 잠깐의 장애일 때만 읽기를 다시 시도한다. 쓰기는 다시 시도하지 않는다 (TanStack Query 의 기본값).
const RETRYABLE = new Set(["NETWORK_ERROR", "TIMEOUT", "SERVICE_UNAVAILABLE"]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && error instanceof ApiError && RETRYABLE.has(error.code);
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 10_000 },
    },
  });
}
