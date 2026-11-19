import type { BackgroundQuoteDto } from "@inkle/contract/background";

// 배경과 다른 시선이 함께 쓰는 표시 글자 (spec-01-09, spec-01-10).

/** 출처의 종류 (ADR-004 §3) */
export const SOURCE_KIND_LABEL: Record<BackgroundQuoteDto["sourceKind"], string> = {
  direct: "직접 한 말",
  editorial: "글쓴이의 정리",
  requote: "다른 글을 다시 인용",
};

/** 주소에서 사이트 이름만 (www. 은 뺀다). 모양이 틀리면 주소 그대로 */
export function siteOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
