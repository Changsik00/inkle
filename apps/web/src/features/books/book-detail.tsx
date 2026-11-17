"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GENRE_LABEL } from "@/features/books/labels";
import { formatDate, STAGE_LABEL } from "@/features/sessions/labels";
import { api, ApiError } from "@/api-client";
import { Button } from "@/ui/button";

export function BookDetail({ bookId, onSessionStarted }: { bookId: string; onSessionStarted: (sessionId: string) => void }) {
  const { data: book, isPending, error } = useQuery(api.books.get.queryOptions({ input: { bookId } }));
  const sessions = useQuery({ ...api.sessions.listForBook.queryOptions({ input: { bookId } }), enabled: !!book });
  const start = useMutation({
    ...api.sessions.start.mutationOptions(),
    onSuccess: (session) => onSessionStarted(session.id),
  });

  if (isPending) return <p className="text-body-sm text-muted-foreground">불러오는 중…</p>;

  if (error) {
    const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
    return (
      <div className="flex flex-col items-start gap-3">
        <p className={notFound ? "text-muted-foreground" : "text-destructive"}>
          {notFound ? "책을 찾을 수 없어요" : "책 정보를 불러오지 못했어요"}
        </p>
        <Button asChild variant="outline">
          <Link href="/">책 목록으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="font-serif text-display">{book.title}</h1>
        <p className="text-muted-foreground">{book.author}</p>
        <p className="text-caption text-muted-foreground">{GENRE_LABEL[book.genre]}</p>
      </header>
      <div className="flex flex-col items-start gap-2">
        <Button onClick={() => start.mutate({ bookId: book.id })} disabled={start.isPending}>
          모임 시작
        </Button>
        <p className="text-body-sm text-muted-foreground">내 해석부터 적어요. 다른 사람의 생각은 그다음에 봐요.</p>
        {start.isError && (
          <p role="alert" className="text-body-sm text-destructive">
            모임을 열지 못했어요. 잠시 뒤 다시 시도해 주세요.
          </p>
        )}
      </div>
      {sessions.data && sessions.data.sessions.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="past-sessions">
          <h2 id="past-sessions" className="text-heading-2">
            지난 모임
          </h2>
          <ul className="border-t border-border">
            {sessions.data.sessions.map((s) => (
              <li key={s.id} className="border-b border-border">
                <Link
                  href={`/sessions/${s.id}/interpretation`}
                  className="flex items-baseline justify-between gap-4 py-3 outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>{formatDate(s.createdAt)} 시작</span>
                  <span className="text-caption text-muted-foreground">{STAGE_LABEL[s.stage]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
