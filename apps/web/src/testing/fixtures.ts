// 화면 테스트에서 쓰는 API 응답 모양. 계약(src/http/contract/)의 스키마를 따른다.
import type { BookDto } from "@inkle/contract/books";

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
