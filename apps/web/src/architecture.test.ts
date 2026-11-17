// 화면의 규칙(ADR-007)을 lint 가 실제로 막는지 확인한다. 설정은 저장소 루트의 eslint.config.mjs.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const eslint = new ESLint({ cwd: repoRoot });
const at = (p: string) => path.join(repoRoot, "apps/web/src", p);

async function ruleHits(file: string, source: string, ruleId: string): Promise<number> {
  const [result] = await eslint.lintText(source, { filePath: at(file) });
  return result.messages.filter((m) => m.ruleId === ruleId).length;
}

describe("화면은 서버 코드를 가져오지 않는다 (ADR-010)", { timeout: 60_000 }, () => {
  it.each([
    'import { container } from "@inkle/backend/container";',
    'import postgres from "postgres";',
  ])("막는다: %s", async (source) => {
    expect(await ruleHits("features/books/probe.tsx", `${source}\nexport {};\n`, "no-restricted-imports")).toBeGreaterThan(0);
  });

  it("계약과 HTTP 클라이언트는 허용한다", async () => {
    const source = 'import type { BookDto } from "@inkle/contract/books";\nimport { api } from "@/api-client";\nexport {};\n';
    expect(await ruleHits("features/books/probe.tsx", source, "no-restricted-imports")).toBe(0);
  });
});

describe("화면 코드의 HTTP 호출 (ADR-007 §7)", { timeout: 60_000 }, () => {
  it("기능 코드에서 fetch 를 직접 쓰면 막는다", async () => {
    const source = 'export async function load() {\n  return fetch("/api/books");\n}\n';
    expect(await ruleHits("features/books/probe.ts", source, "no-restricted-globals")).toBeGreaterThan(0);
  });

  it("HTTP 클라이언트 안에서는 fetch 를 쓸 수 있다", async () => {
    const source = "export const f = (u: string) => fetch(u);\n";
    expect(await ruleHits("api-client/probe.ts", source, "no-restricted-globals")).toBe(0);
  });
});

describe("UI 일관성 (ADR-007 §4, @shadcn/lint)", { timeout: 60_000 }, () => {
  const tsx = (body: string, imports = "") => `${imports}\nexport function Probe() {\n  return ${body};\n}\n`;
  const button = 'import { Button } from "@/ui/button";';

  it("팔레트 색을 직접 쓰면 막는다", async () => {
    expect(await ruleHits("features/books/probe.tsx", tsx('<p className="text-red-500">x</p>'), "shadcn/no-raw-colors")).toBeGreaterThan(0);
  });

  it("토큰 색은 허용한다", async () => {
    expect(await ruleHits("features/books/probe.tsx", tsx('<p className="text-muted-foreground">x</p>'), "shadcn/no-raw-colors")).toBe(0);
  });

  it("눈금 밖 값을 쓰면 막는다", async () => {
    expect(await ruleHits("features/books/probe.tsx", tsx('<div className="rounded-[13px]">x</div>'), "shadcn/no-arbitrary-values")).toBeGreaterThan(0);
  });

  it("공통 부품의 겉모양을 덮어쓰면 막는다", async () => {
    expect(await ruleHits("features/books/probe.tsx", tsx('<Button className="bg-destructive">x</Button>', button), "shadcn/no-restyle")).toBeGreaterThan(0);
  });

  it("공통 부품 안에서는 겉모양을 정할 수 있다", async () => {
    expect(await ruleHits("ui/probe.tsx", tsx('<Button className="bg-destructive">x</Button>', button), "shadcn/no-restyle")).toBe(0);
  });
});
