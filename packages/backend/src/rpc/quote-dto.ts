import type { BackgroundQuoteDto } from "@inkle/contract/background";
import type { Quote } from "../domain/collection";

/** 출처의 인용: 원문은 바깥 사람, 옮김은 AI (ADR-002 §3). 배경과 시선이 함께 쓴다 */
export const quoteDto = (q: Quote): BackgroundQuoteDto => ({
  text: q.text,
  author: "external",
  lang: q.lang,
  translationKo: q.translationKo,
  translationAuthor: q.translationKo === null ? null : "ai",
  sourceKind: q.sourceKind,
});
