import type { BackgroundQuoteDto } from "@inkle/contract/background";
import { SOURCE_KIND_LABEL, siteOf } from "@/features/collection/labels";
import { ExternalQuote } from "@/ui/authored";

/** 대조를 통과한 인용(바깥 사람)과 누가 · 출처의 종류 · 원문 주소 */
export function SourcedQuotes({ quotes, source }: { quotes: BackgroundQuoteDto[]; source: { url: string; who: string } }) {
  return quotes.map((q, i) => (
    <ExternalQuote
      key={i}
      text={q.text}
      lang={q.lang}
      translation={q.translationKo}
      cite={
        <>
          {source.who} · {SOURCE_KIND_LABEL[q.sourceKind]} ·{" "}
          <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
            {siteOf(source.url)}
          </a>
        </>
      }
    />
  ));
}
