// backend 안의 계층 규칙(ADR-006)을 lint 가 실제로 막는지 확인한다. 설정은 저장소 루트의 eslint.config.mjs.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const eslint = new ESLint({ cwd: repoRoot });
const at = (p: string) => path.join(repoRoot, "packages/backend/src", p);

async function restrictedImports(file: string, source: string): Promise<number> {
  const [result] = await eslint.lintText(`${source}\nexport {};\n`, { filePath: at(file) });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports").length;
}

describe("backend 안의 계층 (ADR-006)", { timeout: 60_000 }, () => {
  it.each([
    ["domain/probe.ts", 'import postgres from "postgres";'],
    ["domain/probe.ts", 'import { getSql } from "../infrastructure/db/client";'],
    ["domain/probe.ts", 'import { runNextJob } from "../application/jobs";'],
    ["application/probe.ts", 'import postgres from "postgres";'],
    ["application/probe.ts", 'import { getSql } from "../infrastructure/db/client";'],
    ["application/probe.ts", 'import { container } from "../container";'],
    ["application/probe.ts", 'import { NextResponse } from "next/server";'],
    ["application/probe.ts", 'import { handlers } from "../worker/handlers";'],
    ["application/probe.ts", 'import { router } from "../rpc/router";'],
    ["infrastructure/probe.ts", 'import { container } from "../container";'],
    ["infrastructure/probe.ts", 'import { handlers } from "../worker/handlers";'],
    ["rpc/probe.ts", 'import { useState } from "react";'],
  ])("%s 에서 막는다: %s", async (file, source) => {
    expect(await restrictedImports(file, source)).toBeGreaterThan(0);
  });

  it.each([
    ["application/probe.ts", 'import type { Job } from "../domain/job";'],
    ["infrastructure/probe.ts", 'import type { JobRepository } from "../application/ports";'],
    ["infrastructure/probe.ts", 'import postgres from "postgres";'],
    ["container.ts", 'import { getSql } from "./infrastructure/db/client";'],
    ["rpc/probe.ts", 'import { registerBook } from "../application/books";'],
    ["rpc/probe.ts", 'import { contract } from "@inkle/contract";'],
    ["server/probe.ts", 'import { router } from "../rpc/router";'],
  ])("%s 에서 허용한다: %s", async (file, source) => {
    expect(await restrictedImports(file, source)).toBe(0);
  });
});
