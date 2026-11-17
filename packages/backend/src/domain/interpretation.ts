// 내 해석 (ADR-002 독자 단위, ADR-005 원본). 질문 묶음에 대한 답이고, 고쳐 쓰면 새 판이 덧붙는다.
// 독자가 반드시 쓰는 곳은 여기 한 번뿐이라 (docs/goals.md §원칙) 하나만 답해도 저장된다.
import type { QuestionSet } from "./question-set";

export const ANSWER_MAX = 4000;

export type Answer = { questionId: string; text: string };

export type Interpretation = {
  sessionId: string;
  version: number;
  questionSetId: string;
  answers: Answer[];
  /** 글쓴이 (ADR-002 §3). 내 해석은 언제나 "나" */
  author: "me";
  createdAt: Date;
};

export type InterpretationViolation =
  | { reason: "no_answer" }
  | { reason: "too_long"; questionId: string; max: number }
  | { reason: "unknown_question"; questionId: string }
  | { reason: "duplicate_question"; questionId: string };

const length = (s: string) => [...s].length;

/** 앞뒤 공백을 지우고 빈 답은 버린다. 질문 묶음의 순서대로 돌려준다. */
export function validateAnswers(
  set: QuestionSet,
  input: Answer[],
): { ok: true; answers: Answer[] } | { ok: false; violations: InterpretationViolation[] } {
  const known = new Set(set.questions.map((q) => q.id));
  const seen = new Set<string>();
  const violations: InterpretationViolation[] = [];
  const byQuestion = new Map<string, string>();

  for (const { questionId, text } of input) {
    if (!known.has(questionId)) {
      violations.push({ reason: "unknown_question", questionId });
      continue;
    }
    if (seen.has(questionId)) {
      violations.push({ reason: "duplicate_question", questionId });
      continue;
    }
    seen.add(questionId);
    const trimmed = text.trim();
    if (length(trimmed) > ANSWER_MAX) violations.push({ reason: "too_long", questionId, max: ANSWER_MAX });
    if (trimmed) byQuestion.set(questionId, trimmed);
  }

  if (violations.length) return { ok: false, violations };
  if (byQuestion.size === 0) return { ok: false, violations: [{ reason: "no_answer" }] };
  const answers = set.questions
    .filter((q) => byQuestion.has(q.id))
    .map((q) => ({ questionId: q.id, text: byQuestion.get(q.id)! }));
  return { ok: true, answers };
}
