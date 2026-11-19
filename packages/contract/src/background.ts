import { oc } from "@orpc/contract";
import { z } from "zod";

// 배경 (spec-01-09). 모든 엔드포인트는 문(門)을 거친다: 내 해석을 저장하기 전에는 LOCKED (phase-01 성공 기준 5).
// 모든 글에 글쓴이를 붙인다: 나 / AI / 바깥 사람 (ADR-002 §3).

/** 시대·사회 / 작가의 삶 / 작가가 밝힌 의도 / 그 밖. 도메인 값과 같다 (서버 테스트가 확인) */
export const backgroundTopicSchema = z.enum(["era", "author_life", "author_intent", "other"]);
export type BackgroundTopicDto = z.infer<typeof backgroundTopicSchema>;

/** 모으는 중 / 끝남 / 실패(멈춘 것 포함) / 없음. 내용이나 개수는 담지 않는다 (ADR-004 §7) */
export const collectionStateSchema = z.enum(["collecting", "done", "failed", "none"]);
export type CollectionStateDto = z.infer<typeof collectionStateSchema>;

/** 수집을 기다리는 중 / 만드는 중 / 끝남 / 실패 */
export const connectionStateSchema = z.enum(["waiting", "making", "done", "failed"]);
export type ConnectionStateDto = z.infer<typeof connectionStateSchema>;

export const backgroundQuoteSchema = z.object({
  /** 출처의 문장 그대로 */
  text: z.string(),
  author: z.literal("external"),
  lang: z.string(),
  /** 한국어가 아닌 인용의 옮김 */
  translationKo: z.string().nullable(),
  translationAuthor: z.literal("ai").nullable(),
  /** 직접 인용 / 기자·편집자의 정리 / 재인용 (ADR-004 §3) */
  sourceKind: z.enum(["direct", "editorial", "requote"]),
});
export type BackgroundQuoteDto = z.infer<typeof backgroundQuoteSchema>;

export const backgroundItemSchema = z.object({
  id: z.uuid(),
  topic: backgroundTopicSchema,
  /** 배경 설명 */
  claim: z.string(),
  claimAuthor: z.literal("ai"),
  source: z.object({ url: z.string(), who: z.string() }),
  /** 대조를 통과한 인용만 */
  quotes: z.array(backgroundQuoteSchema),
});
export type BackgroundItemDto = z.infer<typeof backgroundItemSchema>;

export const connectionSchema = z.object({
  /** 내 답에서 그대로 옮긴 구절 */
  myQuote: z.string(),
  myQuoteAuthor: z.literal("me"),
  /** 그 구절이 있는 질문 */
  questionId: z.string(),
  /** 어떻게 맞닿는지 */
  note: z.string(),
  noteAuthor: z.literal("ai"),
});
export type ConnectionDto = z.infer<typeof connectionSchema>;

export const backgroundViewSchema = z.object({
  collection: collectionStateSchema,
  connections: connectionStateSchema,
  /** 내 해석과 맞닿는 배경, 연결 순서대로 */
  connected: z.array(z.object({ item: backgroundItemSchema, connection: connectionSchema })),
  /** 나머지 배경, 주제 순서로. 빈 주제는 없다 */
  others: z.array(z.object({ topic: backgroundTopicSchema, items: z.array(backgroundItemSchema) })),
});
export type BackgroundViewDto = z.infer<typeof backgroundViewSchema>;

/** 문(門)을 거치는 모든 엔드포인트의 오류. 시선(perspectives.ts)도 쓴다 */
export const gateErrors = {
  NOT_FOUND: { status: 404, message: "모임을 찾을 수 없다" },
  LOCKED: { status: 403, message: "내 해석을 먼저 써야 볼 수 있다" },
} as const;

export const backgroundContract = {
  get: oc
    .route({ method: "GET", path: "/sessions/{sessionId}/background", summary: "모임의 배경: 상태, 내 해석과 맞닿는 배경, 나머지 배경" })
    .input(z.object({ sessionId: z.string() }))
    .errors(gateErrors)
    .output(backgroundViewSchema),

  recollect: oc
    .route({
      method: "POST",
      path: "/sessions/{sessionId}/background/recollect",
      summary: "그 책의 수집이 실패했거나 없으면 다시 모은다. 끝났거나 모으는 중이면 아무것도 하지 않는다",
    })
    .input(z.object({ sessionId: z.string() }))
    .errors(gateErrors)
    .output(z.object({ collection: collectionStateSchema })),
};
