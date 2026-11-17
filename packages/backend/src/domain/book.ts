// 책 (ADR-002). 책은 독자와 무관한 공유 자료이고, 같은 책은 하나만 있다.

export const GENRES = ["fiction"] as const;
export type Genre = (typeof GENRES)[number];

export const TITLE_MAX = 200;
export const AUTHOR_MAX = 100;

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  createdAt: Date;
};

export type BookViolation =
  | { field: "title" | "author"; reason: "empty" }
  | { field: "title" | "author"; reason: "too_long"; max: number };

/** 앞뒤 공백을 지우고 안쪽의 연속 공백을 하나로 줄인다. 화면에 보이는 값이다. */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** 사람이 세는 글자 수 (이모지 등을 한 글자로 센다). */
function length(text: string): number {
  return [...text].length;
}

/**
 * 같은 책인지 판단하는 키. 다듬은 제목과 작가를 유니코드 정규형으로 맞추고 대소문자를 무시한다.
 * 번역본과 판본은 구분하지 않는다 (ADR-002).
 * 구분자는 탭이다. cleanText 가 모든 공백을 한 칸 띄어쓰기로 바꾸므로 값 안에 탭은 남지 않는다.
 */
export function bookKey(title: string, author: string): string {
  const norm = (s: string) => cleanText(s).normalize("NFC").toLowerCase();
  return `${norm(title)}\t${norm(author)}`;
}

export function validateBookInput(input: { title: string; author: string }):
  | { ok: true; value: { title: string; author: string } }
  | { ok: false; violations: BookViolation[] } {
  const title = cleanText(input.title);
  const author = cleanText(input.author);
  const violations: BookViolation[] = [];
  const check = (field: "title" | "author", value: string, max: number) => {
    if (value.length === 0) violations.push({ field, reason: "empty" });
    else if (length(value) > max) violations.push({ field, reason: "too_long", max });
  };
  check("title", title, TITLE_MAX);
  check("author", author, AUTHOR_MAX);
  return violations.length ? { ok: false, violations } : { ok: true, value: { title, author } };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBookId(id: string): boolean {
  return UUID.test(id);
}
