"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/api-client";
import { InterpretationForm } from "@/features/sessions/interpretation-form";
import { Button } from "@/ui/button";

export function InterpretationScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: view, isPending, error } = useQuery(api.sessions.get.queryOptions({ input: { sessionId } }));

  if (isPending) return <p className="text-body-sm text-muted-foreground">불러오는 중…</p>;

  if (error) {
    const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
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

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <Link href={`/books/${view.book.id}`} className="text-caption text-muted-foreground hover:text-foreground">
          ← 책 정보 · {view.book.author}
        </Link>
        <h1 className="font-serif text-display">{view.book.title}</h1>
        <p className="text-body-sm text-muted-foreground">
          다른 사람의 생각을 보기 전에 내 생각부터 적어요. 이 글은 나중에 배경과 다른 시선을 비춰 볼 출발점이 돼요.
        </p>
      </header>
      <h2 className="text-heading-2">내 해석</h2>
      <InterpretationForm view={view} />
    </article>
  );
}
