import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": src },
  },
  test: {
    projects: [
      {
        // 도메인, 유스케이스, 저장소, API 처리, HTTP 클라이언트 (ADR-006, ADR-007 §8)
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          // DB 를 쓰는 테스트가 같은 테스트 데이터베이스를 비우고 채우므로 파일을 하나씩 돌린다.
          fileParallelism: false,
        },
      },
      {
        // 컴포넌트: 실제 Chromium 에서 돌리고 HTTP 는 MSW 로 흉내 낸다.
        extends: true,
        publicDir: fileURLToPath(new URL("./src/frontend/testing/public", import.meta.url)),
        // next/link 등 Next.js 의 브라우저 코드가 process.env 를 읽는다. 브라우저에는 없으므로 채워 준다.
        define: { "process.env": JSON.stringify({ NODE_ENV: "test" }) },
        test: {
          name: "browser",
          include: ["src/**/*.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
