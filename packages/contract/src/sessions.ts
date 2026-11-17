import { oc } from "@orpc/contract";
import { z } from "zod";
import { bookSchema } from "./books";

// 도메인 규칙(packages/backend/src/domain/interpretation.ts)과 같은 값이다. 서버 테스트가 둘이 같은지 확인한다.
export const ANSWER_MAX = 4000;

export const sessionStageSchema = z.enum(["writing", "interpretation_saved"]);
export type SessionStageDto = z.infer<typeof sessionStageSchema>;

export const answerSchema = z.object({ questionId: z.string(), text: z.string() });
export type AnswerDto = z.infer<typeof answerSchema>;

export const questionSetSchema = z.object({
  id: z.string(),
  questions: z.array(z.object({ id: z.string(), text: z.string(), hint: z.string().optional() })),
});
export type QuestionSetDto = z.infer<typeof questionSetSchema>;

export const interpretationSchema = z.object({
  version: z.number().int(),
  questionSetId: z.string(),
  answers: z.array(answerSchema),
  /** 글쓴이 (ADR-002 §3). 내 해석은 언제나 "나" */
  author: z.literal("me"),
  createdAt: z.iso.datetime({ offset: true }),
});
export type InterpretationDto = z.infer<typeof interpretationSchema>;

export const sessionSummarySchema = z.object({
  id: z.uuid(),
  bookId: z.uuid(),
  stage: sessionStageSchema,
  createdAt: z.iso.datetime({ offset: true }),
});
export type SessionSummaryDto = z.infer<typeof sessionSummarySchema>;

/**
 * 모임 조회. 내 해석 전후 모두 이 모양이다.
 * 배경·다른 시선·비교는 여기에 담지 않는다. 그 자료는 내 해석을 저장한 뒤 별도 엔드포인트로만 낸다 (성공 기준 5).
 */
export const sessionViewSchema = z.object({
  id: z.uuid(),
  stage: sessionStageSchema,
  createdAt: z.iso.datetime({ offset: true }),
  book: bookSchema,
  questionSet: questionSetSchema,
  interpretation: interpretationSchema.nullable(),
});
export type SessionViewDto = z.infer<typeof sessionViewSchema>;

export const interpretationViolationSchema = z.object({
  reason: z.enum(["no_answer", "too_long", "unknown_question", "duplicate_question"]),
  questionId: z.string().optional(),
  max: z.number().optional(),
});
export type InterpretationViolationDto = z.infer<typeof interpretationViolationSchema>;

export const sessionsContract = {
  start: oc
    .route({ method: "POST", path: "/books/{bookId}/sessions", successStatus: 201, summary: "이 책으로 모임을 연다" })
    .input(z.object({ bookId: z.string() }))
    .errors({ NOT_FOUND: { status: 404, message: "책을 찾을 수 없다" } })
    .output(sessionSummarySchema),

  listForBook: oc
    .route({ method: "GET", path: "/books/{bookId}/sessions", summary: "이 책으로 연 내 모임 (최근 순)" })
    .input(z.object({ bookId: z.string() }))
    .output(z.object({ sessions: z.array(sessionSummarySchema) })),

  get: oc
    .route({ method: "GET", path: "/sessions/{sessionId}", summary: "모임: 책, 질문 묶음, 최근 내 해석, 단계" })
    .input(z.object({ sessionId: z.string() }))
    .errors({ NOT_FOUND: { status: 404, message: "모임을 찾을 수 없다" } })
    .output(sessionViewSchema),

  saveInterpretation: oc
    .route({ method: "PUT", path: "/sessions/{sessionId}/interpretation", summary: "내 해석을 저장한다 (새 판을 덧붙인다)" })
    // 길이 규칙은 도메인이 판단해 INVALID_INTERPRETATION 으로 돌려준다. 여기서는 터무니없는 입력만 막는다.
    .input(z.object({ sessionId: z.string(), answers: z.array(z.object({ questionId: z.string().max(100), text: z.string().max(100_000) })).max(50) }))
    .errors({
      NOT_FOUND: { status: 404, message: "모임을 찾을 수 없다" },
      INVALID_INTERPRETATION: {
        status: 400,
        message: "내 해석이 규칙에 맞지 않는다",
        data: z.object({ violations: z.array(interpretationViolationSchema) }),
      },
    })
    .output(interpretationSchema),
};
