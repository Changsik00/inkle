"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { makeQueryClient } from "@/http/client/query-client";

let browserQueryClient: QueryClient | undefined;

// 서버 렌더링마다 새로 만들고, 브라우저에서는 하나를 계속 쓴다 (Next.js 문서의 TanStack Query 안내).
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
