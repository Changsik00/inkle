// 인용 대조 (ADR-004 §2 의 4단계). 읽기 단계가 "그대로 옮겼다"고 낸 문장이 출처 본문에 실제로 있는지 확인한다.
// 맞춰 주는 차이는 공백, 따옴표 모양, 줄임표 모양뿐이다. 나머지 글자는 한 글자도 다르면 실패한다.

/** 이보다 짧은 인용은 어디에나 있을 수 있어 근거가 되지 못한다. */
export const MIN_QUOTE_LENGTH = 10;

const DOUBLE_QUOTES = /[“”„‟〝〞〟＂«»「」『』]/g;
const SINGLE_QUOTES = /[‘’‚‛′`＇‹›]/g;
const ELLIPSIS = /…|⋯/g;
const WHITESPACE = /\s+/gu;
const WRAPPING = /^["']+|["']+$/g;

export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFC")
    .replace(DOUBLE_QUOTES, '"')
    .replace(SINGLE_QUOTES, "'")
    .replace(ELLIPSIS, "...")
    .replace(WHITESPACE, "");
}

export type QuoteMatch = { verified: true } | { verified: false; reason: "too_short" | "not_found" };

export function matchQuote(quote: string, sourceText: string): QuoteMatch {
  const needle = normalizeForMatch(quote).replace(WRAPPING, "");
  if ([...needle].length < MIN_QUOTE_LENGTH) return { verified: false, reason: "too_short" };
  return normalizeForMatch(sourceText).includes(needle) ? { verified: true } : { verified: false, reason: "not_found" };
}
