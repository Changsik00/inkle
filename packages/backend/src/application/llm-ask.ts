// LLM 에 한 번 묻기 (ADR-004 §1). 받은 결과를 zod 로 다시 검사하고, 틀리거나 실패하면 한 번 더 묻는다.
// 두 호출의 비용과 모델을 모두 장부에 적는다. 수집과 연결 만들기가 함께 쓴다.
import { z } from "zod";
import type { LlmClient, LlmTools } from "./ports";

export type Ledger = { costUsd: number; models: Set<string> };

export const newLedger = (): Ledger => ({ costUsd: 0, models: new Set() });

/** 장부의 비용을 백만분의 일 달러로 자른다 (부동소수 꼬리 제거). */
export const roundedCost = (ledger: Ledger): number => Math.round(ledger.costUsd * 1e6) / 1e6;

export type Asked<T> = { ok: true; value: T; model: string } | { ok: false; error: string };

export async function ask<T>(llm: LlmClient, ledger: Ledger, prompt: string, schema: z.ZodType<T>, tools: LlmTools): Promise<Asked<T>> {
  // CLI 의 검사기는 zod 가 붙이는 $schema(2020-12) 를 알지 못해 거부한다. 형식 자체만 넘긴다.
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  void _dialect;
  let error = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await llm.run({ prompt, jsonSchema, tools });
      ledger.costUsd += r.costUsd;
      ledger.models.add(r.model);
      const parsed = schema.safeParse(r.output);
      if (parsed.success) return { ok: true, value: parsed.data, model: r.model };
      error = `결과 형식이 맞지 않음: ${parsed.error.issues.map((i) => i.path.join(".") || "(전체)").join(", ")}`;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, error };
}
