// 내 해석의 질문 묶음. 장르마다 다르고, 판(id)이 있다.
// 저장한 해석은 어느 판의 질문에 답했는지 함께 남긴다. 질문을 고칠 때는 새 판을 만든다 (ADR-005).
import type { Genre } from "./book";

export type Question = { id: string; text: string; hint?: string };
export type QuestionSet = { id: string; genre: Genre; questions: readonly Question[] };

// 수동 실험의 소설 질문 (docs/experiments/01-manual-flow/prompts.md §1), 해요체로.
export const FICTION_V1: QuestionSet = {
  id: "fiction-v1",
  genre: "fiction",
  questions: [
    { id: "about", text: "이 책은 결국 무엇에 대한 이야기라고 읽었나요?" },
    { id: "lingering", text: "가장 오래 남은 장면이나 문장은 무엇이고, 왜 남았나요?" },
    { id: "difficult", text: "이해되지 않았거나 받아들이기 어려웠던 부분은 무엇인가요?" },
    { id: "why", text: "작가는 왜 이렇게 썼다고 생각하나요?", hint: "결말, 인물, 형식 중 하나를 골라서" },
  ],
};

const ALL: readonly QuestionSet[] = [FICTION_V1];
const CURRENT: Record<Genre, QuestionSet> = { fiction: FICTION_V1 };

/** 이 장르로 새 해석을 쓸 때의 묶음 */
export function questionSetFor(genre: Genre): QuestionSet {
  return CURRENT[genre];
}

/** 저장된 해석이 답한 묶음 */
export function questionSetById(id: string): QuestionSet | null {
  return ALL.find((s) => s.id === id) ?? null;
}
