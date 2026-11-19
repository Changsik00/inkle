"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthorPerspectiveDto, OtherPerspectiveDto, PerspectivesViewDto } from "@inkle/contract/perspectives";
import type { SessionViewDto } from "@inkle/contract/sessions";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { api, ApiError } from "@/api-client";
import { Collecting, Locked, NotChecked, POLL_MS } from "@/features/collection/collection-notices";
import { SessionFrame } from "@/features/collection/session-frame";
import { SourcedQuotes } from "@/features/collection/sourced-quotes";
import { PREVALENCE_LABEL, ROLE_LABEL } from "@/features/perspectives/labels";
import { AiText } from "@/ui/authored";

/**
 * 다른 시선 (spec-01-10). 내 해석을 저장한 뒤에만 볼 수 있다 (문, phase-01 성공 기준 5).
 * 다른 사람의 읽기(흔한 것부터), 작가 본인의 말, AI 가 만든 해석을 따로 묶는다. 실제 사람의 글이 먼저다.
 */
export function PerspectivesScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <PerspectivesView sessionId={sessionId} />;
}

/** 주소에서 모임 번호를 읽지 않는 본체 (화면 테스트가 쓴다) */
export function PerspectivesView({ sessionId }: { sessionId: string }) {
  return (
    <SessionFrame
      sessionId={sessionId}
      back="background"
      intro="다른 사람들이 이 책을 어떻게 읽었는지예요. 출처의 문장을 직접 확인한 것만 보여 줘요."
      heading="다른 시선"
    >
      {(session) => <PerspectivesBody session={session} />}
    </SessionFrame>
  );
}

function PerspectivesBody({ session }: { session: SessionViewDto }) {
  const perspectives = useQuery({
    ...api.perspectives.get.queryOptions({ input: { sessionId: session.id } }),
    enabled: session.interpretation !== null,
    refetchInterval: (query) => (query.state.data?.collection === "collecting" ? POLL_MS : false),
  });

  const locked = session.interpretation === null || (perspectives.error instanceof ApiError && perspectives.error.code === "LOCKED");
  if (locked) return <Locked sessionId={session.id} what="다른 시선" />;
  if (perspectives.isPending) return <p className="text-body-sm text-muted-foreground">불러오는 중…</p>;
  if (perspectives.error) return <p className="text-body-sm text-destructive">다른 시선을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>;
  return <Perspectives sessionId={session.id} data={perspectives.data} />;
}

function Perspectives({ sessionId, data }: { sessionId: string; data: PerspectivesViewDto }) {
  if (data.collection === "collecting") return <Collecting />;
  const emptyText = "출처의 문장으로 확인한 시선이 없어요.";
  if (data.collection === "failed" || data.collection === "none") return <NotChecked sessionId={sessionId} canRetry emptyText={emptyText} />;
  if (data.others.length + data.author.length + data.imagined.length === 0) {
    return <NotChecked sessionId={sessionId} canRetry={false} emptyText={emptyText} />;
  }

  return (
    <div className="flex flex-col gap-12">
      {data.others.length > 0 && (
        <Group title="다른 사람의 읽기" note="많이 나온 읽기인지 드문 읽기인지는 찾은 글 사이에서 본 것이에요. 어느 읽기가 맞다는 뜻이 아니에요.">
          {data.others.map((p) => (
            <Row key={p.id}>
              <PerspectiveItem perspective={p} meta={[p.who, ROLE_LABEL[p.role], PREVALENCE_LABEL[p.prevalence]]} />
            </Row>
          ))}
        </Group>
      )}

      {data.author.length > 0 && (
        <Group title="작가 본인의 말">
          {data.author.map((p) => (
            <Row key={p.id}>
              <PerspectiveItem perspective={p} meta={[p.who]} />
            </Row>
          ))}
        </Group>
      )}

      {data.imagined.length > 0 && (
        <Group title="AI 가 만든 해석" note="실제 사람의 글이 아니에요. 찾은 시선이 적어 AI 가 만들었어요.">
          {data.imagined.map((p) => (
            <Row key={p.id}>
              <AiText>{p.reading}</AiText>
            </Row>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6" aria-label={title}>
      <div className="flex flex-col gap-1">
        <h3 className="text-label">{title}</h3>
        {note && <p className="text-body-sm text-muted-foreground">{note}</p>}
      </div>
      <ul className="flex flex-col gap-8">{children}</ul>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <li className="flex flex-col gap-4 border-b border-border pb-8 last:border-b-0 last:pb-0">{children}</li>;
}

/** 외부 사람의 시선 하나: 누가 · 어떤 사람 · 흔한 정도, 읽기(AI 가 정리), 인용(바깥 사람)과 출처 */
function PerspectiveItem({ perspective, meta }: { perspective: OtherPerspectiveDto | AuthorPerspectiveDto; meta: (string | null)[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-label">{meta.filter(Boolean).join(" · ")}</p>
      <AiText label="AI 가 정리">{perspective.reading}</AiText>
      <SourcedQuotes quotes={perspective.quotes} source={perspective.source} />
    </div>
  );
}
