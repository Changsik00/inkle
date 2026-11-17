import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 계층의 의존 규칙 (ADR-006 §1). 의존은 바깥에서 안쪽으로만 간다.
// 상대 경로(../infrastructure/…)도 막도록 "**/" 형태를 함께 둔다.
const layer = (...names) => names.flatMap((n) => [`@/${n}`, `@/${n}/**`, `**/${n}`, `**/${n}/**`]);
const frameworks = ["postgres", "next", "next/**", "react", "react/**", "react-dom", "react-dom/**"];

const restrict = (group, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...layer("application", "infrastructure", "server", "app", "worker", "cli", "testing"), ...frameworks],
      "도메인은 다른 계층과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/application/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      [...layer("infrastructure", "server", "app", "worker", "cli", "testing"), ...frameworks],
      "애플리케이션은 포트(ports.ts)로만 바깥에 닿는다. 인프라·조립·진입점과 DB·프레임워크를 가져오지 않는다 (ADR-006).",
    ),
  },
  {
    files: ["src/infrastructure/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrict(
      layer("server", "app", "worker", "cli", "testing"),
      "인프라는 조립과 진입점을 가져오지 않는다 (ADR-006).",
    ),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
