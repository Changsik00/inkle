import { plugin as shadcn } from "@shadcn/lint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 계층의 의존 규칙 (ADR-006 §1, ADR-007 §7). 의존은 바깥에서 안쪽으로만 간다.
// 상대 경로(../infrastructure/…)도 막도록 "**/" 형태를 함께 둔다.
const layer = (...names) => names.flatMap((n) => [`@/${n}`, `@/${n}/**`, `**/${n}`, `**/${n}/**`]);
const frameworks = ["postgres", "next", "next/**", "react", "react/**", "react-dom", "react-dom/**"];

const restrict = (group, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
});

const serverSide = layer("server", "application", "infrastructure");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // ── 서버 계층 (ADR-006)
  {
    files: ["src/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...layer("application", "infrastructure", "server", "app", "worker", "cli", "testing", "features", "ui", "http"), ...frameworks],
      "도메인은 다른 계층과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/application/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...layer("infrastructure", "server", "app", "worker", "cli", "testing", "features", "ui", "http"), ...frameworks],
      "애플리케이션은 포트(ports.ts)로만 바깥에 닿는다. 인프라·조립·진입점과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/infrastructure/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      layer("server", "app", "worker", "cli", "testing", "features", "ui", "http"),
      "인프라는 조립과 진입점을 가져오지 않는다 (ADR-006).",
    ),
  },
  // ── 화면 (ADR-007 §7)
  {
    files: ["src/features/**/*.{ts,tsx}", "src/ui/**/*.{ts,tsx}", "src/http/**/*.ts"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: restrict(
      [...serverSide, ...layer("domain"), "postgres"],
      "화면 코드는 HTTP 계약과 클라이언트(@/http)로만 서버에 닿는다 (ADR-007).",
    ),
  },
  {
    files: ["src/http/contract/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...serverSide, ...layer("domain"), ...frameworks],
      "계약은 서버와 화면이 함께 쓰므로 React·Next.js 와 서버 코드를 가져오지 않는다 (ADR-007).",
    ),
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**", "**/*.test.{ts,tsx}"],
    rules: restrict(
      [...serverSide, "postgres"],
      "페이지와 레이아웃은 자료를 읽지 않는 틀이다. 서버 코드는 src/app/api/ 의 route 파일만 부른다 (ADR-007).",
    ),
  },
  {
    files: ["src/features/**/*.{ts,tsx}", "src/ui/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "서버는 src/http/client/ 를 거쳐 부른다 (ADR-007 §3)." },
      ],
    },
  },
  // ── UI 일관성 (ADR-007 §4)
  {
    files: ["src/**/*.{ts,tsx}"],
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
    files: ["src/ui/**/*.{ts,tsx}"],
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
    "src/testing/browser/public/**",
  ]),
]);

export default eslintConfig;
