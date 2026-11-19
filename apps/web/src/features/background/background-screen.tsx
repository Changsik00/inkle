"use client";

import { useQuery } from "@tanstack/react-query";
import type { BackgroundViewDto } from "@inkle/contract/background";
import type { SessionViewDto } from "@inkle/contract/sessions";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/api-client";
import { BackgroundItem, ConnectedItem } from "@/features/background/background-item";
import { TOPIC_LABEL } from "@/features/background/labels";
import { Collecting, Locked, Notice, NotChecked, POLL_MS } from "@/features/collection/collection-notices";
import { SessionFrame } from "@/features/collection/session-frame";
import { Button } from "@/ui/button";

function stillWorking(view: BackgroundViewDto | undefined): boolean {
  if (!view) return false;
  if (view.collection === "collecting") return true;
  return view.collection === "done" && (view.connections === "making" || view.connections === "waiting");
}

/**
 * 배경 (spec-01-09). 내 해석을 저장한 뒤에만 볼 수 있다 (문, phase-01 성공 기준 5).
 * 내 해석과 맞닿는 배경을 위에, 나머지는 주제별로 접어 둔다.
 */
export function BackgroundScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <BackgroundView sessionId={sessionId} />;
}

/** 주소에서 모임 번호를 읽지 않는 본체 (화면 테스트가 쓴다) */
export function BackgroundView({ sessionId }: { sessionId: string }) {
  return (
    <SessionFrame
      sessionId={sessionId}
      back="interpretation"
      intro="작품이 쓰인 때와 작가가 한 말이에요. 출처의 문장을 직접 확인한 것만 보여 줘요."
      heading="배경"
    >
      {(session) => <BackgroundBody session={session} />}
    </SessionFrame>
  );
}

function BackgroundBody({ session }: { session: SessionViewDto }) {
  const background = useQuery({
    ...api.background.get.queryOptions({ input: { sessionId: session.id } }),
    enabled: session.interpretation !== null,
    refetchInterval: (query) => (stillWorking(query.state.data) ? POLL_MS : false),
  });

  const locked = session.interpretation === null || (background.error instanceof ApiError && background.error.code === "LOCKED");
  if (locked) return <Locked sessionId={session.id} what="배경" />;
  if (background.isPending) return <p className="text-body-sm text-muted-foreground">불러오는 중…</p>;
  if (background.error) return <p className="text-body-sm text-destructive">배경을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>;
  return (
    <>
      <Background data={background.data} session={session} />
      <nav className="border-t border-border pt-6">
        <Button asChild variant="outline">
          <Link href={`/sessions/${session.id}/perspectives`}>다른 시선 보기</Link>
        </Button>
      </nav>
    </>
  );
}

function Background({ data, session }: { data: BackgroundViewDto; session: SessionViewDto }) {
  if (data.collection === "collecting") return <Collecting />;
  const emptyText = "출처의 문장으로 확인한 배경이 없어요.";
  if (data.collection === "failed" || data.collection === "none") return <NotChecked sessionId={session.id} canRetry emptyText={emptyText} />;

  const total = data.connected.length + data.others.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) return <NotChecked sessionId={session.id} canRetry={false} emptyText={emptyText} />;

  const questionText = (id: string) => session.questionSet.questions.find((q) => q.id === id)?.text;
  const otherCount = total - data.connected.length;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6" aria-labelledby="connected-heading">
        <h3 id="connected-heading" className="text-label">
          내 해석과 맞닿는 배경
        </h3>
        {data.connections === "making" || data.connections === "waiting" ? (
          <Notice>
            <p className="text-body-sm text-muted-foreground">내 해석과 맞닿는 배경을 찾는 중이에요.</p>
          </Notice>
        ) : data.connections === "failed" ? (
          <p className="text-body-sm text-muted-foreground">내 해석과 잇지 못했어요. 모은 배경은 아래에 있어요.</p>
        ) : data.connected.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">내 해석과 바로 맞닿는 배경은 찾지 못했어요. 모은 배경은 아래에 있어요.</p>
        ) : (
          <ol className="flex flex-col gap-10">
            {data.connected.map(({ item, connection }) => (
              <li key={item.id} className="flex flex-col gap-4 border-b border-border pb-10 last:border-b-0 last:pb-0">
                <ConnectedItem item={item} connection={connection} questionText={questionText(connection.questionId)} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {otherCount > 0 && (
        <details open={data.connections === "done" && data.connected.length === 0 ? true : undefined} className="group flex flex-col gap-6">
          <summary className="cursor-pointer text-label text-muted-foreground hover:text-foreground">다른 배경 {otherCount}개</summary>
          <div className="mt-6 flex flex-col gap-10">
            {data.others.map((group) => (
              <section key={group.topic} className="flex flex-col gap-6" aria-label={TOPIC_LABEL[group.topic]}>
                <h4 className="text-label">{TOPIC_LABEL[group.topic]}</h4>
                <ul className="flex flex-col gap-8">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <BackgroundItem item={item} showTopic={false} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
