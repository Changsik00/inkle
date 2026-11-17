// 브라우저 모드 컴포넌트 테스트에서 앱과 같은 제공자로 그린다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { render } from "vitest-browser-react";

export function renderWithProviders(ui: ReactNode, options: { searchParams?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={options.searchParams}>{ui}</NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}
