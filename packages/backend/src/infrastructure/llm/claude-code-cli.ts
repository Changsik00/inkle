// LlmClient 를 Claude Code CLI 로 구현한다 (ADR-004 §1). 기기에 로그인된 CLI 를 비대화로 실행한다.
// - 프로젝트 설정(CLAUDE.md, 훅)을 읽지 않도록 빈 임시 디렉토리에서 실행한다.
// - 표준 입력을 닫는다. 주지 않으면 CLI 가 3초를 기다린다 (spec-01-03 가정 1).
// - ANTHROPIC_API_KEY 는 넘기지 않는다. 있으면 구독 대신 API 로 청구된다.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import type { LlmCall, LlmClient, LlmResult } from "../../application/ports";

export type ClaudeCodeCliOptions = {
  /** 실행 파일. 기본은 PATH 의 claude */
  command?: string;
  /** 정하지 않으면 CLI 의 기본 모델 */
  model?: string;
  /** 호출 한 번의 시간 제한. 기본 5분 */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 5 * 60_000;
const MAX_TURNS = { "web-search": 12, none: 3 } as const;
const STDERR_TAIL = 500;

const reply = z.object({
  is_error: z.boolean().optional(),
  subtype: z.string().optional(),
  result: z.string().optional(),
  total_cost_usd: z.number().optional(),
  modelUsage: z.record(z.string(), z.unknown()).optional(),
  structured_output: z.unknown().optional(),
});

type Exit = { code: number | null; stdout: string; stderr: string; timedOut: boolean };

export class ClaudeCodeCli implements LlmClient {
  private readonly command: string;
  private readonly timeoutMs: number;

  constructor(private readonly options: ClaudeCodeCliOptions = {}) {
    this.command = options.command ?? "claude";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async run(call: LlmCall): Promise<LlmResult> {
    const args = [
      "-p",
      call.prompt,
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(call.jsonSchema),
      "--tools",
      call.tools === "web-search" ? "WebSearch" : "",
      ...(call.tools === "web-search" ? ["--allowedTools", "WebSearch"] : []),
      "--max-turns",
      String(MAX_TURNS[call.tools]),
      ...(this.options.model ? ["--model", this.options.model] : []),
    ];

    const cwd = await mkdtemp(path.join(tmpdir(), "inkle-llm-"));
    let exit: Exit;
    try {
      exit = await this.exec(args, cwd);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }

    if (exit.timedOut) throw new Error(`CLI 시간 초과 (${this.timeoutMs}ms)`);
    if (exit.code !== 0) throw new Error(`CLI 종료 코드 ${exit.code}: ${exit.stderr.slice(-STDERR_TAIL).trim()}`);

    let parsed: z.infer<typeof reply>;
    try {
      parsed = reply.parse(JSON.parse(exit.stdout));
    } catch {
      throw new Error(`CLI 출력이 JSON 이 아님: ${exit.stdout.slice(0, 200)}`);
    }
    if (parsed.is_error) throw new Error(`CLI 오류 응답 (${parsed.subtype ?? "알 수 없음"}): ${(parsed.result ?? "").slice(0, 300)}`);

    const model = Object.keys(parsed.modelUsage ?? {})[0] ?? this.options.model ?? "unknown";
    return { output: parsed.structured_output ?? null, costUsd: parsed.total_cost_usd ?? 0, model };
  }

  private exec(args: string[], cwd: string): Promise<Exit> {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, this.timeoutMs);
      child.stdout.setEncoding("utf8").on("data", (d: string) => (stdout += d));
      child.stderr.setEncoding("utf8").on("data", (d: string) => (stderr += d));
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(new Error(`CLI 를 실행하지 못함 (${this.command}): ${e.message}`));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr, timedOut });
      });
    });
  }
}
