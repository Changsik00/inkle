import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 없는 주소로 링크를 걸면 타입 오류 (ADR-007 §1)
  typedRoutes: true,
  // 자동 메모이제이션. useMemo / useCallback 을 손으로 쓰지 않는다 (ADR-007 §9)
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
