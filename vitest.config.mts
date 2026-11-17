import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // DB 를 쓰는 테스트가 같은 테스트 데이터베이스를 비우고 채우므로 파일을 하나씩 돌린다.
    fileParallelism: false,
  },
});
