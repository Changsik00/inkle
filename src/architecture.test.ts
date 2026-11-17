// 의존 규칙(ADR-006 §1, ADR-007 §7, ADR-008)과 UI 규칙(ADR-007 §4)을 lint 가 실제로 막는지 확인한다.
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

async function ruleHits(filePath: string, source: string, ruleId: string): Promise<number> {
  const [result] = await eslint.lintText(source, { filePath });
  return result.messages.filter((m) => m.ruleId === ruleId).length;
}

const restrictedImports = (filePath: string, source: string) =>
  ruleHits(filePath, `${source}\nexport {};\n`, "no-restricted-imports");

describe("backend · frontend · shared 의 경계 (ADR-008)", { timeout: 60_000 }, () => {
  it.each([
    ["src/frontend/features/books/probe.tsx", 'import { container } from "@/backend/container";'],
    ["src/frontend/features/books/probe.tsx", 'import type { Book } from "@/backend/domain/book";'],
    ["src/frontend/features/books/probe.tsx", 'import { registerBook } from "../../../backend/application/books";'],
    ["src/frontend/ui/probe.tsx", 'import { getSql } from "@/backend/infrastructure/db/client";'],
    ["src/frontend/api-client/probe.ts", 'import { router } from "@/backend/rpc/router";'],
    ["src/frontend/features/books/probe.tsx", 'import postgres from "postgres";'],
    ["src/backend/rpc/probe.ts", 'import { Button } from "@/frontend/ui/button";'],
    ["src/backend/application/probe.ts", 'import { api } from "@/frontend/api-client";'],
    ["src/backend/rpc/probe.ts", 'import { useState } from "react";'],
    ["src/shared/contract/probe.ts", 'import { container } from "@/backend/container";'],
    ["src/shared/contract/probe.ts", 'import { api } from "@/frontend/api-client";'],
    ["src/shared/contract/probe.ts", 'import { useState } from "react";'],
    ["src/shared/contract/probe.ts", 'import { headers } from "next/headers";'],
    ["src/shared/contract/probe.ts", 'import postgres from "postgres";'],
    ["src/app/books/page.tsx", 'import { container } from "@/backend/container";'],
    ["src/app/books/page.tsx", 'import { listBooks } from "@/backend/application/books";'],
    // API 는 별도 서버다 (ADR-009). src/app 에는 backend 를 부르는 입구가 없다.
    ["src/app/api/probe/route.ts", 'import { container } from "@/backend/container";'],
  ])("%s 에서 막는다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBeGreaterThan(0);
  });

  it.each([
    ["src/frontend/features/books/probe.tsx", 'import { api } from "@/frontend/api-client";'],
    ["src/frontend/features/books/probe.tsx", 'import { Button } from "@/frontend/ui/button";'],
    ["src/frontend/features/books/probe.tsx", 'import type { BookDto } from "@/shared/contract/books";'],
    ["src/frontend/api-client/probe.ts", 'import { contract } from "@/shared/contract";'],
    ["src/backend/rpc/probe.ts", 'import { contract } from "@/shared/contract";'],
    ["src/app/books/page.tsx", 'import { BookList } from "@/frontend/features/books/book-list";'],
  ])("%s 에서 허용한다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBe(0);
  });
});

describe("backend 안의 계층 (ADR-006)", { timeout: 60_000 }, () => {
  it.each([
    ["src/backend/domain/probe.ts", 'import postgres from "postgres";'],
    ["src/backend/domain/probe.ts", 'import { getSql } from "@/backend/infrastructure/db/client";'],
    ["src/backend/domain/probe.ts", 'import { runNextJob } from "@/backend/application/jobs";'],
    ["src/backend/application/probe.ts", 'import postgres from "postgres";'],
    ["src/backend/application/probe.ts", 'import { getSql } from "@/backend/infrastructure/db/client";'],
    ["src/backend/application/probe.ts", 'import { getSql } from "../infrastructure/db/client";'],
    ["src/backend/application/probe.ts", 'import { container } from "@/backend/container";'],
    ["src/backend/application/probe.ts", 'import { NextResponse } from "next/server";'],
    ["src/backend/application/probe.ts", 'import { handlers } from "@/backend/worker/handlers";'],
    ["src/backend/application/probe.ts", 'import { router } from "@/backend/rpc/router";'],
    ["src/backend/infrastructure/probe.ts", 'import { container } from "@/backend/container";'],
    ["src/backend/infrastructure/probe.ts", 'import { handlers } from "@/backend/worker/handlers";'],
  ])("%s 에서 막는다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBeGreaterThan(0);
  });

  it.each([
    ["src/backend/application/probe.ts", 'import type { Job } from "@/backend/domain/job";'],
    ["src/backend/infrastructure/probe.ts", 'import type { JobRepository } from "@/backend/application/ports";'],
    ["src/backend/infrastructure/probe.ts", 'import postgres from "postgres";'],
    ["src/backend/container.ts", 'import { getSql } from "@/backend/infrastructure/db/client";'],
    ["src/backend/rpc/probe.ts", 'import { registerBook } from "@/backend/application/books";'],
    ["src/backend/server/probe.ts", 'import { container } from "@/backend/container";'],
  ])("%s 에서 허용한다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBe(0);
  });
});

describe("화면 코드의 HTTP 호출 (ADR-007 §7)", { timeout: 60_000 }, () => {
  it("기능 코드에서 fetch 를 직접 쓰면 막는다", async () => {
    const source = 'export async function load() {\n  return fetch("/api/books");\n}\n';
    expect(await ruleHits("src/frontend/features/books/probe.ts", source, "no-restricted-globals")).toBeGreaterThan(0);
  });

  it("HTTP 클라이언트 안에서는 fetch 를 쓸 수 있다", async () => {
    const source = "export const f = (u: string) => fetch(u);\n";
    expect(await ruleHits("src/frontend/api-client/probe.ts", source, "no-restricted-globals")).toBe(0);
  });
});

describe("UI 일관성 (ADR-007 §4, @shadcn/lint)", { timeout: 60_000 }, () => {
  const tsx = (body: string, imports = "") => `${imports}\nexport function Probe() {\n  return ${body};\n}\n`;
  const button = 'import { Button } from "@/frontend/ui/button";';

  it("팔레트 색을 직접 쓰면 막는다", async () => {
    const source = tsx('<p className="text-red-500">x</p>');
    expect(await ruleHits("src/frontend/features/books/probe.tsx", source, "shadcn/no-raw-colors")).toBeGreaterThan(0);
  });

  it("토큰 색은 허용한다", async () => {
    const source = tsx('<p className="text-muted-foreground">x</p>');
    expect(await ruleHits("src/frontend/features/books/probe.tsx", source, "shadcn/no-raw-colors")).toBe(0);
  });

  it("눈금 밖 값을 쓰면 막는다", async () => {
    const source = tsx('<div className="rounded-[13px]">x</div>');
    expect(await ruleHits("src/frontend/features/books/probe.tsx", source, "shadcn/no-arbitrary-values")).toBeGreaterThan(0);
  });

  it("공통 부품의 겉모양을 덮어쓰면 막는다", async () => {
    const source = tsx('<Button className="bg-destructive">x</Button>', button);
    expect(await ruleHits("src/frontend/features/books/probe.tsx", source, "shadcn/no-restyle")).toBeGreaterThan(0);
  });

  it("공통 부품 안에서는 겉모양을 정할 수 있다", async () => {
    const source = tsx('<Button className="bg-destructive">x</Button>', button);
    expect(await ruleHits("src/frontend/ui/probe.tsx", source, "shadcn/no-restyle")).toBe(0);
  });
});
