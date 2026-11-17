// 계층의 의존 규칙(ADR-006 §1)을 lint 가 실제로 막는지 확인한다.
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

async function ruleHits(filePath: string, source: string, ruleId: string): Promise<number> {
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages.filter((m) => m.ruleId === ruleId).length;
}

const restrictedImports = (filePath: string, source: string) =>
  ruleHits(filePath, `${source}\nexport {};\n`, "no-restricted-imports");

describe("계층의 의존 규칙", { timeout: 60_000 }, () => {
  it.each([
    ["src/domain/probe.ts", 'import postgres from "postgres";'],
    ["src/domain/probe.ts", 'import { getSql } from "@/infrastructure/db/client";'],
    ["src/domain/probe.ts", 'import { runNextJob } from "@/application/jobs";'],
    ["src/domain/probe.ts", 'import { useState } from "react";'],
    ["src/application/probe.ts", 'import postgres from "postgres";'],
    ["src/application/probe.ts", 'import { getSql } from "@/infrastructure/db/client";'],
    ["src/application/probe.ts", 'import { getSql } from "../infrastructure/db/client";'],
    ["src/application/probe.ts", 'import { container } from "@/server/container";'],
    ["src/application/probe.ts", 'import { NextResponse } from "next/server";'],
    ["src/application/probe.ts", 'import { handlers } from "@/worker/handlers";'],
    ["src/infrastructure/probe.ts", 'import { container } from "@/server/container";'],
    ["src/infrastructure/probe.ts", 'import { handlers } from "@/worker/handlers";'],
    // 화면 (ADR-007 §7)
    ["src/features/books/probe.tsx", 'import { container } from "@/server/container";'],
    ["src/features/books/probe.tsx", 'import { registerBook } from "@/application/books";'],
    ["src/features/books/probe.tsx", 'import { getSql } from "@/infrastructure/db/client";'],
    ["src/features/books/probe.tsx", 'import type { Book } from "@/domain/book";'],
    ["src/ui/probe.tsx", 'import { container } from "@/server/container";'],
    ["src/http/client/probe.ts", 'import { container } from "@/server/container";'],
    ["src/http/client/probe.ts", 'import type { Job } from "@/domain/job";'],
    ["src/http/contract/probe.ts", 'import { useState } from "react";'],
    ["src/http/contract/probe.ts", 'import { headers } from "next/headers";'],
    ["src/app/books/page.tsx", 'import { container } from "@/server/container";'],
    ["src/app/books/page.tsx", 'import { listBooks } from "@/application/books";'],
  ])("%s 에서 막는다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBeGreaterThan(0);
  });

  it.each([
    ["src/application/probe.ts", 'import type { Job } from "@/domain/job";'],
    ["src/infrastructure/probe.ts", 'import type { JobRepository } from "@/application/ports";'],
    ["src/infrastructure/probe.ts", 'import postgres from "postgres";'],
    ["src/server/probe.ts", 'import { getSql } from "@/infrastructure/db/client";'],
    ["src/app/api/probe/route.ts", 'import { container } from "@/server/container";'],
    ["src/features/books/probe.tsx", 'import { api } from "@/http/client";'],
    ["src/features/books/probe.tsx", 'import { Button } from "@/ui/button";'],
    ["src/http/client/probe.ts", 'import { contract } from "@/http/contract";'],
    ["src/server/rpc/probe.ts", 'import { contract } from "@/http/contract";'],
  ])("%s 에서 허용한다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBe(0);
  });
});

describe("화면 코드의 HTTP 호출 (ADR-007 §7)", { timeout: 60_000 }, () => {
  it("기능 코드에서 fetch 를 직접 쓰면 막는다", async () => {
    const source = 'export async function load() {\n  return fetch("/api/books");\n}\n';
    expect(await ruleHits("src/features/books/probe.ts", source, "no-restricted-globals")).toBeGreaterThan(0);
  });

  it("HTTP 클라이언트 안에서는 fetch 를 쓸 수 있다", async () => {
    const source = "export const f = (u: string) => fetch(u);\n";
    expect(await ruleHits("src/http/client/probe.ts", source, "no-restricted-globals")).toBe(0);
  });
});

describe("UI 일관성 (ADR-007 §4, @shadcn/lint)", { timeout: 60_000 }, () => {
  const tsx = (body: string, imports = "") => `${imports}\nexport function Probe() {\n  return ${body};\n}\n`;

  it("팔레트 색을 직접 쓰면 막는다", async () => {
    const source = tsx('<p className="text-red-500">x</p>');
    expect(await ruleHits("src/features/books/probe.tsx", source, "shadcn/no-raw-colors")).toBeGreaterThan(0);
  });

  it("토큰 색은 허용한다", async () => {
    const source = tsx('<p className="text-muted-foreground">x</p>');
    expect(await ruleHits("src/features/books/probe.tsx", source, "shadcn/no-raw-colors")).toBe(0);
  });

  it("눈금 밖 값을 쓰면 막는다", async () => {
    const source = tsx('<div className="rounded-[13px]">x</div>');
    expect(await ruleHits("src/features/books/probe.tsx", source, "shadcn/no-arbitrary-values")).toBeGreaterThan(0);
  });

  it("공통 부품의 겉모양을 덮어쓰면 막는다", async () => {
    const source = tsx('<Button className="bg-destructive">x</Button>', 'import { Button } from "@/ui/button";');
    expect(await ruleHits("src/features/books/probe.tsx", source, "shadcn/no-restyle")).toBeGreaterThan(0);
  });

  it("공통 부품 안에서는 겉모양을 정할 수 있다", async () => {
    const source = tsx('<Button className="bg-destructive">x</Button>', 'import { Button } from "@/ui/button";');
    expect(await ruleHits("src/ui/probe.tsx", source, "shadcn/no-restyle")).toBe(0);
  });
});
