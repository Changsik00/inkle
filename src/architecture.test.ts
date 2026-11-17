// 계층의 의존 규칙(ADR-006 §1)을 lint 가 실제로 막는지 확인한다.
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

async function restrictedImports(filePath: string, source: string): Promise<number> {
  const [result] = await eslint.lintText(`${source}\nexport {};\n`, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports").length;
}

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
  ])("%s 에서 막는다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBeGreaterThan(0);
  });

  it.each([
    ["src/application/probe.ts", 'import type { Job } from "@/domain/job";'],
    ["src/infrastructure/probe.ts", 'import type { JobRepository } from "@/application/ports";'],
    ["src/infrastructure/probe.ts", 'import postgres from "postgres";'],
    ["src/server/probe.ts", 'import { getSql } from "@/infrastructure/db/client";'],
    ["src/app/api/probe/route.ts", 'import { container } from "@/server/container";'],
  ])("%s 에서 허용한다: %s", async (filePath, source) => {
    expect(await restrictedImports(filePath, source)).toBe(0);
  });
});
