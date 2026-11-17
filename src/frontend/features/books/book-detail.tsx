"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GENRE_LABEL } from "@/frontend/features/books/labels";
import { api, ApiError } from "@/frontend/api-client";
import { Button } from "@/frontend/ui/button";

export function BookDetail({ bookId }: { bookId: string }) {
  const { data: book, isPending, error } = useQuery(api.books.get.queryOptions({ input: { bookId } }));

  if (isPending) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

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
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
        <p className="text-muted-foreground">{book.author}</p>
        <p className="text-sm text-muted-foreground">{GENRE_LABEL[book.genre]}</p>
      </header>
      <div className="flex flex-col items-start gap-2">
        {/* 모임은 spec-01-05 에서 연다 */}
        <Button disabled>모임 시작</Button>
        <p className="text-sm text-muted-foreground">모임은 다음 단계에서 열 수 있어요.</p>
      </div>
    </article>
  );
}
