import { plugin as shadcn } from "@shadcn/lint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 워크스페이스 전체의 lint (ADR-010). 영역 경계는 패키지 의존성이 지키고, 여기서는 그 안쪽 규칙을 지킨다.
// - packages/backend 안의 계층 (ADR-006)
// - apps/web 의 HTTP 호출과 UI 일관성 (ADR-007)
// - packages/contract 는 React·Next.js·DB 를 가져오지 않는다
// 확인: packages/backend/src/architecture.test.ts, apps/web/src/architecture.test.ts
const part = (...names) => names.flatMap((n) => [`**/${n}`, `**/${n}/**`]);
const react = ["react", "react/**", "react-dom", "react-dom/**"];
const next = ["next", "next/**"];

const restrict = (group, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React 는 apps/web 에만 있어 루트에서 판을 찾지 못한다. 판을 직접 적는다.
  { settings: { next: { rootDir: "apps/web/" }, react: { version: "19.3" } } },

  // ── 계약
  {
    files: ["packages/contract/src/**/*.ts"],
    rules: restrict(
      [...react, ...next, "postgres", "@inkle/*", "@inkle/*/**"],
      "계약은 서버와 화면이 함께 쓰므로 React·Next.js·DB·다른 패키지를 가져오지 않는다 (ADR-010).",
    ),
  },

  // ── backend 안의 계층 (ADR-006)
  {
    files: ["packages/backend/src/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...part("application", "infrastructure", "rpc", "server", "worker", "testing", "container"), ...react, ...next, "postgres"],
      "도메인은 다른 계층과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["packages/backend/src/application/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...part("infrastructure", "rpc", "server", "worker", "testing", "container"), ...react, ...next, "postgres"],
      "애플리케이션은 포트(ports.ts)로만 바깥에 닿는다. 인프라·조립·진입점과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["packages/backend/src/infrastructure/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...part("rpc", "server", "worker", "testing", "container"), ...react, ...next],
      "인프라는 조립과 진입점을 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: [
      "packages/backend/src/*.ts",
      "packages/backend/src/{rpc,server,worker}/**/*.ts",
      "apps/api/src/**/*.ts",
      "apps/worker/src/**/*.ts",
    ],
    ignores: ["**/*.test.ts"],
    rules: restrict([...react, ...next], "서버 코드는 React·Next.js 를 가져오지 않는다 (ADR-010)."),
  },

  // ── 화면 (ADR-007). 의존성에 없어 타입 검사가 먼저 막지만, 같은 실수를 lint 메시지로도 알린다.
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: restrict(
      ["@inkle/backend", "@inkle/backend/**", "postgres"],
      "화면은 서버 코드를 가져오지 않는다. 서버에는 HTTP 클라이언트(@/api-client)로만 닿는다 (ADR-007, ADR-010).",
    ),
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "apps/web/src/api-client/**", "apps/web/src/testing/**"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: "서버는 src/api-client/ 를 거쳐 부른다 (ADR-007 §3)." }],
    },
  },

  // ── UI 일관성 (ADR-007 §4)
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    plugins: { shadcn },
    settings: { shadcn: { componentImports: ["^@/ui(?:/|$)"] } },
    rules: {
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    },
  },
  {
    // 공통 부품은 자기 겉모양을 정한다. shadcn/ui 가 만든 코드는 임의 선택자를 쓴다.
    files: ["apps/web/src/ui/**/*.{ts,tsx}"],
    rules: {
      "shadcn/no-restyle": "off",
      "shadcn/no-arbitrary-values": "off",
    },
  },

  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // MSW 가 만든 서비스 워커
    "apps/web/src/testing/public/**",
  ]),
]);

export default eslintConfig;
