// 화면 테스트에서 쓰는 API 응답 모양. 계약(@inkle/contract)의 스키마를 따른다.
import type { BookDto } from "@inkle/contract/books";
import type { InterpretationDto, SessionSummaryDto, SessionViewDto } from "@inkle/contract/sessions";

export function bookDto(overrides: Partial<BookDto> = {}): BookDto {
  return {
    id: "00000000-0000-4000-8000-000000000b01",
    title: "노인과 바다",
    author: "어니스트 헤밍웨이",
    genre: "fiction",
    createdAt: "2026-11-17T00:00:00.000Z",
    ...overrides,
  };
}

/** oRPC 가 계약에 선언한 오류를 보낼 때의 응답 본문 */
export function definedError(code: string, status: number, data?: unknown) {
  return { defined: true, code, status, message: code, data };
}

export const SESSION_ID = "00000000-0000-4000-8000-0000000005e1";

export const FICTION_QUESTIONS: SessionViewDto["questionSet"] = {
  id: "fiction-v1",
  questions: [
    { id: "about", text: "이 책은 결국 무엇에 대한 이야기라고 읽었나요?" },
    { id: "lingering", text: "가장 오래 남은 장면이나 문장은 무엇이고, 왜 남았나요?" },
    { id: "difficult", text: "이해되지 않았거나 받아들이기 어려웠던 부분은 무엇인가요?" },
    { id: "why", text: "작가는 왜 이렇게 썼다고 생각하나요?", hint: "결말, 인물, 형식 중 하나를 골라서" },
  ],
};

export function interpretationDto(overrides: Partial<InterpretationDto> = {}): InterpretationDto {
  return {
    version: 1,
    questionSetId: "fiction-v1",
    answers: [{ questionId: "about", text: "꿈을 놓지 않는 이야기" }],
    author: "me",
    createdAt: "2026-11-18T00:00:00.000Z",
    ...overrides,
  };
}

export function sessionViewDto(overrides: Partial<SessionViewDto> = {}): SessionViewDto {
  return {
    id: SESSION_ID,
    stage: "writing",
    createdAt: "2026-11-18T00:00:00.000Z",
    book: bookDto(),
    questionSet: FICTION_QUESTIONS,
    interpretation: null,
    ...overrides,
  };
}

export function sessionSummaryDto(overrides: Partial<SessionSummaryDto> = {}): SessionSummaryDto {
  return {
    id: SESSION_ID,
    bookId: bookDto().id,
    stage: "writing",
    createdAt: "2026-11-18T00:00:00.000Z",
    ...overrides,
  };
}
