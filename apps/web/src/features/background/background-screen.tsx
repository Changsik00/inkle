"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BackgroundViewDto } from "@inkle/contract/background";
import type { SessionViewDto } from "@inkle/contract/sessions";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api, ApiError } from "@/api-client";
import { BackgroundItem, ConnectedItem } from "@/features/background/background-item";
import { TOPIC_LABEL } from "@/features/background/labels";
import { Button } from "@/ui/button";

/** 수집이나 연결이 진행 중일 때 다시 읽는 간격 */
export const POLL_MS = 3000;

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
  const session = useQuery(api.sessions.get.queryOptions({ input: { sessionId } }));
  const background = useQuery({
    ...api.background.get.queryOptions({ input: { sessionId } }),
    enabled: session.data?.interpretation != null,
    refetchInterval: (query) => (stillWorking(query.state.data) ? POLL_MS : false),
  });

  if (session.isPending) return <p className="text-body-sm text-muted-foreground">불러오는 중…</p>;
  if (session.error) {
    const notFound = session.error instanceof ApiError && session.error.code === "NOT_FOUND";
    return (
      <div className="flex flex-col items-start gap-3">
        <p className={notFound ? "text-muted-foreground" : "text-destructive"}>
          {notFound ? "모임을 찾을 수 없어요" : "모임을 불러오지 못했어요"}
        </p>
        <Button asChild variant="outline">
          <Link href="/">책 목록으로</Link>
        </Button>
      </div>
    );
  }

  const view = session.data;
  const locked = view.interpretation === null || (background.error instanceof ApiError && background.error.code === "LOCKED");

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <Link href={`/sessions/${view.id}/interpretation`} className="text-caption text-muted-foreground hover:text-foreground">
          ← 내 해석 · {view.book.author}
        </Link>
        <h1 className="font-serif text-display">{view.book.title}</h1>
        <p className="text-body-sm text-muted-foreground">
          작품이 쓰인 때와 작가가 한 말이에요. 출처의 문장을 직접 확인한 것만 보여 줘요.
        </p>
      </header>
      <h2 className="text-heading-2">배경</h2>
      {locked ? (
        <Locked sessionId={view.id} />
      ) : background.isPending ? (
        <p className="text-body-sm text-muted-foreground">불러오는 중…</p>
      ) : background.error ? (
        <p className="text-body-sm text-destructive">배경을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>
      ) : (
        <Background sessionId={view.id} data={background.data} session={view} />
      )}
    </article>
  );
}

function Locked({ sessionId }: { sessionId: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-body-md text-muted-foreground">내 해석을 먼저 써 주세요. 쓴 뒤에 배경을 볼 수 있어요.</p>
      <Button asChild>
        <Link href={`/sessions/${sessionId}/interpretation`}>내 해석 쓰기</Link>
      </Button>
    </div>
  );
}

function Notice({ children, status = true }: { children: ReactNode; status?: boolean }) {
  return (
    <div role={status ? "status" : undefined} className="flex flex-col items-start gap-3 border-l-2 border-rule-strong pl-4">
      {children}
    </div>
  );
}

function Background({ sessionId, data, session }: { sessionId: string; data: BackgroundViewDto; session: SessionViewDto }) {
  if (data.collection === "collecting") {
    return (
      <Notice>
        <p className="text-label">자료를 모으는 중이에요</p>
        <p className="text-body-sm text-muted-foreground">출처를 직접 열어 문장을 확인하느라 몇 분 걸려요. 이 화면은 저절로 바뀌어요.</p>
      </Notice>
    );
  }
  if (data.collection === "failed" || data.collection === "none") return <NotChecked sessionId={sessionId} canRetry />;

  const total = data.connected.length + data.others.reduce((n, g) => n + g.items.length, 0);
  if (total === 0) return <NotChecked sessionId={sessionId} canRetry={false} />;

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

function NotChecked({ sessionId, canRetry }: { sessionId: string; canRetry: boolean }) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState(false);
  const recollect = useMutation({
    ...api.background.recollect.mutationOptions(),
    onSuccess: async () => {
      setProblem(false);
      await queryClient.invalidateQueries({ queryKey: api.background.key() });
    },
    onError: () => setProblem(true),
  });
  return (
    <Notice status={false}>
      <p className="text-label">확인하지 못했어요</p>
      <p className="text-body-sm text-muted-foreground">
        {canRetry ? "자료를 모으지 못했어요. 다시 모을 수 있어요." : "출처의 문장으로 확인한 배경이 없어요."}
      </p>
      {canRetry && (
        <Button variant="outline" disabled={recollect.isPending} onClick={() => recollect.mutate({ sessionId })}>
          다시 모으기
        </Button>
      )}
      {problem && (
        <p role="alert" className="text-body-sm text-destructive">
          다시 모으지 못했어요. 잠시 뒤 다시 시도해 주세요.
        </p>
      )}
    </Notice>
  );
}
