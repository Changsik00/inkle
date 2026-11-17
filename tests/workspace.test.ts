// 영역 경계는 패키지 의존성이 지킨다 (ADR-010). 각 package.json 을 읽어 규칙을 확인한다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type PackageJson = {
  name: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const root = path.resolve(__dirname, "..");
const read = (dir: string): PackageJson => JSON.parse(readFileSync(path.join(root, dir, "package.json"), "utf8"));
const deps = (pkg: PackageJson) =>
  Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies });

const workspaces = {
  web: "apps/web",
  api: "apps/api",
  worker: "apps/worker",
  contract: "packages/contract",
  backend: "packages/backend",
} as const;

const isReactOrNext = (d: string) => d === "react" || d === "react-dom" || d === "next" || d.startsWith("@next/");

describe("워크스페이스", () => {
  it("다섯 패키지가 정해진 이름으로 있고 모두 비공개다", () => {
    const names = Object.values(workspaces).map((dir) => read(dir));
    expect(names.map((p) => p.name)).toEqual([
      "@inkle/web",
      "@inkle/api",
      "@inkle/worker",
      "@inkle/contract",
      "@inkle/backend",
    ]);
    expect(names.every((p) => p.private)).toBe(true);
  });

  it("화면(web)은 backend, api, worker, DB 에 의존하지 않는다", () => {
    const d = deps(read(workspaces.web));
    expect(d).toContain("@inkle/contract");
    expect(d.filter((x) => ["@inkle/backend", "@inkle/api", "@inkle/worker", "postgres"].includes(x))).toEqual([]);
  });

  it("계약(contract)은 zod 와 @orpc/contract 에만 의존한다", () => {
    expect(deps(read(workspaces.contract)).sort()).toEqual(["@orpc/contract", "zod"]);
  });

  it("backend 는 React, Next.js, 앱에 의존하지 않는다", () => {
    const d = deps(read(workspaces.backend));
    expect(d.filter(isReactOrNext)).toEqual([]);
    expect(d.filter((x) => ["@inkle/web", "@inkle/api", "@inkle/worker"].includes(x))).toEqual([]);
  });

  it("api 와 worker 는 backend 를 거쳐서만 서버 코드에 닿고 화면에 의존하지 않는다", () => {
    for (const dir of [workspaces.api, workspaces.worker]) {
      const d = deps(read(dir));
      expect(d).toContain("@inkle/backend");
      expect(d.filter((x) => x === "@inkle/web" || isReactOrNext(x))).toEqual([]);
    }
  });
});
