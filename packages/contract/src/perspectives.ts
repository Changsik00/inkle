import { oc } from "@orpc/contract";
import { z } from "zod";
import { backgroundQuoteSchema, collectionStateSchema, gateErrors } from "./background";

// 다른 시선 (spec-01-10). 문(門)을 거친다: 내 해석을 저장하기 전에는 LOCKED (phase-01 성공 기준 5).
// 외부 사람의 시선은 읽기(AI 가 정리)와 인용(바깥 사람)을 따로 담는다. AI 가 만든 해석은 따로 묶는다 (ADR-002 §2, §3).

/** 다수 의견 / 일부 / 드문 읽기 / 알 수 없음 (ADR-002 §2). 우열이 아니다 */
export const prevalenceSchema = z.enum(["majority", "some", "rare", "unknown"]);
export type PrevalenceDto = z.infer<typeof prevalenceSchema>;

const sourceSchema = z.object({ url: z.string(), who: z.string() });

/** 작가 본인이 아닌 사람의 시선 */
export const otherPerspectiveSchema = z.object({
  id: z.uuid(),
  who: z.string(),
  /** 평론가·기자 / 독자 / 그 밖 */
  role: z.enum(["critic", "reader", "other"]),
  /** 이 시선의 읽기를 AI 가 정리한 문장 */
  reading: z.string(),
  readingAuthor: z.literal("ai"),
  prevalence: prevalenceSchema,
  source: sourceSchema,
  /** 대조를 통과한 인용만 */
  quotes: z.array(backgroundQuoteSchema),
});
export type OtherPerspectiveDto = z.infer<typeof otherPerspectiveSchema>;

/** 작가 본인의 시선. 흔한 읽기인지는 붙이지 않는다 */
export const authorPerspectiveSchema = otherPerspectiveSchema.omit({ role: true, prevalence: true });
export type AuthorPerspectiveDto = z.infer<typeof authorPerspectiveSchema>;

/** AI 가 만든 해석. 실제 사람의 글이 아니고 출처가 없다 */
export const imaginedPerspectiveSchema = z.object({
  id: z.uuid(),
  reading: z.string(),
  readingAuthor: z.literal("ai"),
});
export type ImaginedPerspectiveDto = z.infer<typeof imaginedPerspectiveSchema>;

export const perspectivesViewSchema = z.object({
  collection: collectionStateSchema,
  /** 흔한 것부터: 다수 → 일부 → 드문 → 알 수 없음, 같은 값 안에서는 모은 순서 */
  others: z.array(otherPerspectiveSchema),
  author: z.array(authorPerspectiveSchema),
  /** 다른 사람의 시선이 모자랄 때만 있다 */
  imagined: z.array(imaginedPerspectiveSchema),
});
export type PerspectivesViewDto = z.infer<typeof perspectivesViewSchema>;

export const perspectivesContract = {
  get: oc
    .route({ method: "GET", path: "/sessions/{sessionId}/perspectives", summary: "모임의 다른 시선: 다른 사람의 읽기, 작가 본인의 말, AI 가 만든 해석" })
    .input(z.object({ sessionId: z.string() }))
    .errors(gateErrors)
    .output(perspectivesViewSchema),
};
