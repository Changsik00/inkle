import { plugin as shadcn } from "@shadcn/lint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 의존 규칙. 확인은 src/architecture.test.ts.
// - src 는 backend · frontend · shared 로 나뉘고, backend 와 frontend 는 서로 가져오지 않는다 (ADR-008).
// - backend 안은 domain ← application ← infrastructure / rpc · worker · cli (ADR-006).
// - 화면은 HTTP 클라이언트로만 서버에 닿는다 (ADR-007).
// 상대 경로(../backend/…)도 막도록 "**/" 형태를 함께 둔다.
const area = (...names) => names.flatMap((n) => [`@/${n}`, `@/${n}/**`, `**/${n}`, `**/${n}/**`]);
const backendPart = (...names) => names.flatMap((n) => [`@/backend/${n}`, `@/backend/${n}/**`, `**/${n}`, `**/${n}/**`]);
const react = ["react", "react/**", "react-dom", "react-dom/**"];
const next = ["next", "next/**"];

const restrict = (group, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── 큰 경계 (ADR-008)
  {
    files: ["src/shared/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...area("backend", "frontend", "app"), ...react, ...next, "postgres"],
      "shared 는 서버와 화면이 함께 쓰므로 아무 영역도, React·Next.js·DB 도 가져오지 않는다 (ADR-008).",
    ),
  },
  {
    files: ["src/frontend/**/*.{ts,tsx}"],
    rules: restrict(
      [...area("backend"), "postgres"],
      "frontend 는 backend 를 가져오지 않는다. 서버에는 HTTP 클라이언트(@/frontend/api-client)로만 닿는다 (ADR-007, ADR-008).",
    ),
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: restrict(
      [...area("backend"), "postgres"],
      "src/app 은 화면 라우트만 둔다. API 는 별도 서버(src/backend/server)다 (ADR-008, ADR-009).",
    ),
  },

  // ── backend 안의 계층 (ADR-006). backend 전체에 frontend·React·Next.js 금지를 함께 건다.
  {
    files: ["src/backend/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...area("frontend"), ...backendPart("application", "infrastructure", "rpc", "server", "worker", "cli", "testing", "container"), ...react, ...next, "postgres"],
      "도메인은 다른 계층과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/backend/application/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...area("frontend"), ...backendPart("infrastructure", "rpc", "server", "worker", "cli", "testing", "container"), ...react, ...next, "postgres"],
      "애플리케이션은 포트(ports.ts)로만 바깥에 닿는다. 인프라·조립·진입점과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/backend/infrastructure/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...area("frontend"), ...backendPart("rpc", "server", "worker", "cli", "testing", "container"), ...react, ...next],
      "인프라는 조립과 진입점을 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/backend/*.ts", "src/backend/rpc/**/*.ts", "src/backend/server/**/*.ts", "src/backend/worker/**/*.ts", "src/backend/cli/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict([...area("frontend"), ...react, ...next], "backend 는 frontend 와 React·Next.js 를 가져오지 않는다 (ADR-008)."),
  },

  // ── 화면의 HTTP 호출 (ADR-007 §3)
  {
    files: ["src/frontend/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "src/frontend/api-client/**", "src/frontend/testing/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "서버는 src/frontend/api-client/ 를 거쳐 부른다 (ADR-007 §3)." },
      ],
    },
  },

  // ── UI 일관성 (ADR-007 §4)
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    plugins: { shadcn },
    settings: { shadcn: { componentImports: ["^@/frontend/ui(?:/|$)"] } },
    rules: {
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    },
  },
  {
    // 공통 부품은 자기 겉모양을 정한다. shadcn/ui 가 만든 코드는 임의 선택자를 쓴다.
    files: ["src/frontend/ui/**/*.{ts,tsx}"],
    rules: {
      "shadcn/no-restyle": "off",
      "shadcn/no-arbitrary-values": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // MSW 가 만든 서비스 워커
    "src/frontend/testing/public/**",
  ]),
]);

export default eslintConfig;
