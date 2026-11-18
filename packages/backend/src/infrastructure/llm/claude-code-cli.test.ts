// 실제 claude 대신 같은 자리에 놓은 가짜 실행 파일로 경계를 시험한다. 실제 CLI 는 부르지 않는다.
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ClaudeCodeCli } from "./claude-code-cli";

let dir: string;
let record: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "inkle-fake-claude-"));
  record = path.join(dir, "record.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** 받은 인자·작업 디렉토리·표준 입력·환경을 기록하고, body 가 정한 대로 응답하는 가짜 claude. */
async function fakeClaude(body: string): Promise<string> {
  const file = path.join(dir, "claude");
  await writeFile(
    file,
    `#!/usr/bin/env node
const fs = require("node:fs");
let stdin = "";
try { stdin = fs.readFileSync(0, "utf8"); } catch (e) { stdin = "error:" + e.code; }
fs.writeFileSync(${JSON.stringify(record)}, JSON.stringify({
  argv: process.argv.slice(2),
  cwd: process.cwd(),
  cwdEntries: fs.readdirSync(process.cwd()),
  stdin,
  apiKey: process.env.ANTHROPIC_API_KEY ?? null,
}));
${body}
`,
  );
  await chmod(file, 0o755);
  return file;
}

const ok = (extra: object = {}) =>
  `process.stdout.write(JSON.stringify({ type: "result", subtype: "success", is_error: false, num_turns: 2, total_cost_usd: 0.12, modelUsage: { "claude-test-1": {} }, structured_output: { a: 1 }, ...${JSON.stringify(extra)} }));`;

const recorded = async () =>
  JSON.parse(await readFile(record, "utf8")) as { argv: string[]; cwd: string; cwdEntries: string[]; stdin: string; apiKey: string | null };

const call = { prompt: "질문입니다", jsonSchema: { type: "object", properties: { a: { type: "number" } } } };

describe("ClaudeCodeCli", () => {
  it("비대화로 실행하고 결과 형식·비용·모델을 돌려준다", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(ok()) });
    expect(await cli.run({ ...call, tools: "none" })).toEqual({ output: { a: 1 }, costUsd: 0.12, model: "claude-test-1" });

    const r = await recorded();
    expect(r.argv.slice(0, 2)).toEqual(["-p", "질문입니다"]);
    expect(r.argv).toEqual(expect.arrayContaining(["--output-format", "json", "--json-schema", JSON.stringify(call.jsonSchema)]));
    expect(r.argv[r.argv.indexOf("--tools") + 1]).toBe("");
    expect(r.argv).not.toContain("--allowedTools");
  });

  it("기기의 MCP 서버와 사용자 설정을 싣지 않는다 (호출마다 Serena 가 뜨던 문제)", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(ok()) });
    await cli.run({ ...call, tools: "none" });
    const { argv } = await recorded();
    expect(argv).toContain("--strict-mcp-config");
    expect(argv).not.toContain("--mcp-config");
    expect(argv[argv.indexOf("--setting-sources") + 1]).toBe("");
  });

  it("웹 검색은 WebSearch 도구 하나만 켠다", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(ok()) });
    await cli.run({ ...call, tools: "web-search" });
    const { argv } = await recorded();
    expect(argv[argv.indexOf("--tools") + 1]).toBe("WebSearch");
    expect(argv[argv.indexOf("--allowedTools") + 1]).toBe("WebSearch");
  });

  it("프로젝트 설정이 없는 빈 임시 디렉토리에서, 표준 입력을 닫고 실행하고 끝나면 지운다", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(ok()) });
    await cli.run({ ...call, tools: "none" });
    const r = await recorded();
    expect(r.cwdEntries).toEqual([]);
    expect(r.stdin).toBe("");
    expect(path.resolve(r.cwd)).not.toBe(path.resolve(process.cwd()));
    await expect(stat(r.cwd)).rejects.toThrow();
  });

  it("API 키를 넘기지 않는다. 기기에 로그인된 구독으로 실행한다 (ADR-004 §1)", async () => {
    process.env.ANTHROPIC_API_KEY = "dummy-not-a-key";
    try {
      const cli = new ClaudeCodeCli({ command: await fakeClaude(ok()) });
      await cli.run({ ...call, tools: "none" });
      expect((await recorded()).apiKey).toBeNull();
    } finally {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it("모델을 정하면 넘기고, 응답에 모델이 없으면 정한 모델로 적는다", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(ok({ modelUsage: {} })), model: "claude-chosen" });
    expect((await cli.run({ ...call, tools: "none" })).model).toBe("claude-chosen");
    const { argv } = await recorded();
    expect(argv[argv.indexOf("--model") + 1]).toBe("claude-chosen");
  });

  it("결과 형식이 없으면 output 은 null (다시 묻는 것은 부른 쪽이 정한다)", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(ok({ structured_output: null })) });
    expect((await cli.run({ ...call, tools: "none" })).output).toBeNull();
  });

  it("오류 응답, 0 이 아닌 종료, JSON 이 아닌 출력은 던진다", async () => {
    const errorReply = new ClaudeCodeCli({ command: await fakeClaude(ok({ is_error: true, subtype: "error_max_turns", result: "턴 초과" })) });
    await expect(errorReply.run({ ...call, tools: "none" })).rejects.toThrow(/error_max_turns/);

    const exit = new ClaudeCodeCli({ command: await fakeClaude(`process.stderr.write("로그인 필요"); process.exit(1);`) });
    await expect(exit.run({ ...call, tools: "none" })).rejects.toThrow(/종료 코드 1.*로그인 필요/);

    const garbage = new ClaudeCodeCli({ command: await fakeClaude(`process.stdout.write("hello");`) });
    await expect(garbage.run({ ...call, tools: "none" })).rejects.toThrow(/JSON/);
  });

  it("시간 제한을 넘기면 멈추고 던진다", async () => {
    const cli = new ClaudeCodeCli({ command: await fakeClaude(`setTimeout(() => {}, 10_000);`), timeoutMs: 300 });
    const started = Date.now();
    await expect(cli.run({ ...call, tools: "none" })).rejects.toThrow(/시간 초과/);
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it("실행 파일이 없으면 던진다", async () => {
    const cli = new ClaudeCodeCli({ command: path.join(dir, "없는-claude") });
    await expect(cli.run({ ...call, tools: "none" })).rejects.toThrow(/실행하지 못함/);
  });
});
