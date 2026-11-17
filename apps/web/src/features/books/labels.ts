import type { BookDto, BookViolationDto } from "@inkle/contract/books";

export const GENRE_LABEL: Record<BookDto["genre"], string> = { fiction: "소설" };

const FIELD_LABEL: Record<BookViolationDto["field"], string> = { title: "제목", author: "작가" };

// 받침 유무에 따라 조사를 고른다 (제목은 / 작가는, 제목을 / 작가를).
const hasBatchim = (word: string) => (word.charCodeAt(word.length - 1) - 0xac00) % 28 !== 0;
const eunNeun = (word: string) => `${word}${hasBatchim(word) ? "은" : "는"}`;
const eulReul = (word: string) => `${word}${hasBatchim(word) ? "을" : "를"}`;

export function emptyMessage(field: BookViolationDto["field"]): string {
  return `${eulReul(FIELD_LABEL[field])} 입력해 주세요`;
}

export function tooLongMessage(field: BookViolationDto["field"], max: number): string {
  return `${eunNeun(FIELD_LABEL[field])} ${max}자까지 쓸 수 있어요`;
}

export function violationMessage(v: BookViolationDto): string {
  return v.reason === "empty" ? emptyMessage(v.field) : tooLongMessage(v.field, v.max ?? 0);
}
