// 모든 패키지의 테스트를 루트에서 한 번에 돌린다 (ADR-010). `pnpm test`
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const webAlias = { "@": at("./apps/web/src") };

export default defineConfig({
  test: {
    projects: [
      {
        // 서버: 도메인, 유스케이스, 저장소, API 처리와 서버, 계층 규칙 (ADR-006)
        test: {
          name: "backend",
          root: at("./packages/backend"),
          environment: "node",
          include: ["src/**/*.test.ts"],
          // DB 를 쓰는 테스트가 같은 테스트 데이터베이스를 비우고 채우므로 파일을 하나씩 돌린다.
          fileParallelism: false,
        },
      },
      {
        // 화면 중 브라우저가 필요 없는 것: HTTP 클라이언트, 화면 규칙
        resolve: { alias: webAlias },
        test: {
          name: "web",
          root: at("./apps/web"),
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        // 화면 컴포넌트: 실제 Chromium 에서 돌리고 HTTP 는 MSW 로 흉내 낸다 (ADR-007 §8)
        resolve: { alias: webAlias },
        publicDir: at("./apps/web/src/testing/public"),
        // next/link 등 Next.js 의 브라우저 코드가 process.env 를 읽는다. 브라우저에는 없으므로 채워 준다.
        define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
        test: {
          name: "web-browser",
          root: at("./apps/web"),
          include: ["src/**/*.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        // 저장소 수준: 패키지 의존성으로 지키는 영역 경계 (ADR-010)
        test: { name: "workspace", root: at("."), environment: "node", include: ["tests/**/*.test.ts"] },
      },
    ],
  },
});
