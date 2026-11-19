"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionViewDto } from "@inkle/contract/sessions";
import Link from "next/link";
import type { ReactNode } from "react";
import { api, ApiError } from "@/api-client";
import { Button } from "@/ui/button";

/**
 * 모임의 읽는 단계(배경, 다른 시선)의 틀: 모임을 읽고, 돌아갈 곳·책 제목·안내·절 제목을 그린다.
 * 본문은 읽은 모임을 받아 그린다.
 */
export function SessionFrame({
  sessionId,
  back,
  intro,
  heading,
  children,
}: {
  sessionId: string;
  /** 돌아갈 단계 */
  back: "interpretation" | "background";
  intro: string;
  heading: string;
  children: (session: SessionViewDto) => ReactNode;
}) {
  const session = useQuery(api.sessions.get.queryOptions({ input: { sessionId } }));

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
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <Link
          href={back === "interpretation" ? `/sessions/${view.id}/interpretation` : `/sessions/${view.id}/background`}
          className="text-caption text-muted-foreground hover:text-foreground"
        >
          ← {back === "interpretation" ? "내 해석" : "배경"} · {view.book.author}
        </Link>
        <h1 className="font-serif text-display">{view.book.title}</h1>
        <p className="text-body-sm text-muted-foreground">{intro}</p>
      </header>
      <h2 className="text-heading-2">{heading}</h2>
      {children(view)}
    </article>
  );
}
