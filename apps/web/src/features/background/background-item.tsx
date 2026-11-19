import type { BackgroundItemDto, ConnectionDto } from "@inkle/contract/background";
import { SOURCE_KIND_LABEL, siteOf, TOPIC_LABEL } from "@/features/background/labels";
import { AiText, ExternalQuote, MyText } from "@/ui/authored";

/** 배경 항목 하나: 주제, 설명(AI), 대조를 통과한 인용(바깥 사람)과 출처 */
export function BackgroundItem({ item, showTopic = true }: { item: BackgroundItemDto; showTopic?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {showTopic && <p className="text-label">{TOPIC_LABEL[item.topic]}</p>}
      <AiText>{item.claim}</AiText>
      {item.quotes.map((q, i) => (
        <ExternalQuote
          key={i}
          text={q.text}
          lang={q.lang}
          translation={q.translationKo}
          cite={
            <>
              {item.source.who} · {SOURCE_KIND_LABEL[q.sourceKind]} ·{" "}
              <a href={item.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
                {siteOf(item.source.url)}
              </a>
            </>
          }
        />
      ))}
    </div>
  );
}

/** 내 해석과 맞닿는 배경: 내 구절(나) → 맞닿는 방식(AI) → 배경 */
export function ConnectedItem({
  item,
  connection,
  questionText,
}: {
  item: BackgroundItemDto;
  connection: ConnectionDto;
  questionText: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-4">
      <MyText label={questionText ? `내가 씀 · ${questionText}` : undefined}>{connection.myQuote}</MyText>
      <AiText label="AI 가 씀 · 맞닿는 곳">{connection.note}</AiText>
      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <BackgroundItem item={item} />
      </div>
    </div>
  );
}
