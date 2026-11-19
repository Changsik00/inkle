// 테스트용 LLM. 정해 둔 답을 돌려주고 받은 호출을 기록한다. 실제 CLI 는 부르지 않는다.
import type { LlmCall, LlmClient, LlmResult } from "../../application/ports";

export type FakeAnswer = unknown | Error;

/** 지시문을 보고 답을 고르는 함수. Error 를 돌려주면 그 호출은 던진다. */
export type FakeResponder = (call: LlmCall, index: number) => FakeAnswer;

export class FakeLlm implements LlmClient {
  readonly calls: LlmCall[] = [];

  constructor(
    private readonly respond: FakeResponder,
    private readonly options: { costUsd?: number; model?: string } = {},
  ) {}

  async run(call: LlmCall): Promise<LlmResult> {
    this.calls.push(call);
    const answer = this.respond(call, this.calls.length - 1);
    if (answer instanceof Error) throw answer;
    return { output: answer, costUsd: this.options.costUsd ?? 0.1, model: this.options.model ?? "fake-model" };
  }

  /** 지시문으로 단계를 가늠한다: 찾기 / 읽기 / 흔한 읽기 / 연결 */
  static stageOf(call: LlmCall): "find" | "read" | "prevalence" | "connect" {
    if (call.tools === "web-search") return "find";
    if (call.prompt.includes("<내 해석>")) return "connect";
    return call.prompt.includes("<본문>") ? "read" : "prevalence";
  }
}
