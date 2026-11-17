import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 없는 주소로 링크를 걸면 타입 오류 (ADR-007 §1)
  typedRoutes: true,
  // 자동 메모이제이션. useMemo / useCallback 을 손으로 쓰지 않는다 (ADR-007 §9)
  reactCompiler: true,
  // 화면과 API 는 다른 서버다 (ADR-009). 브라우저는 같은 주소의 /api 를 부르고, Next.js 가 API 서버로 넘긴다.
  // 화면 코드와 HTTP 클라이언트는 이 사실을 모른다.
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
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
