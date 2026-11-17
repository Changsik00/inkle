"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GENRE_LABEL } from "@/features/books/labels";
import { api } from "@/api-client";
import { Button } from "@/ui/button";

// 모임을 열 책을 고르는 곳. 서재 관리는 하지 않는다 (docs/goals.md §하지 않을 것).
// 카드 격자가 아니라 가는 선으로 나눈 행 (DESIGN.md §Layout, book-row).
export function BookList() {
  const { data, isPending, isError, refetch } = useQuery(api.books.list.queryOptions());

  if (isPending) return <p className="text-body-sm text-muted-foreground">불러오는 중…</p>;

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body-sm text-destructive">책 목록을 불러오지 못했어요</p>
        <Button variant="outline" onClick={() => refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (data.books.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 border-t border-border pt-6">
        <p className="text-muted-foreground">아직 등록한 책이 없어요</p>
        <Button asChild>
          <Link href="/books/new">첫 책 등록하기</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="border-t border-border">
      {data.books.map((book) => (
        <li key={book.id} className="border-b border-border">
          <Link
            href={`/books/${book.id}`}
            className="flex flex-col gap-0.5 py-4 outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-serif text-title-book">{book.title}</span>
            <span className="text-caption text-muted-foreground">
              {book.author} · {GENRE_LABEL[book.genre]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
