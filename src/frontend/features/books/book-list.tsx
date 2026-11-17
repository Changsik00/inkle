"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GENRE_LABEL } from "@/frontend/features/books/labels";
import { api } from "@/frontend/api-client";
import { Button } from "@/frontend/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/frontend/ui/card";

// 모임을 열 책을 고르는 곳. 서재 관리는 하지 않는다 (docs/goals.md §하지 않을 것).
export function BookList() {
  const { data, isPending, isError, refetch } = useQuery(api.books.list.queryOptions());

  if (isPending) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">책 목록을 불러오지 못했어요</p>
        <Button variant="outline" onClick={() => refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (data.books.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground">아직 등록한 책이 없어요</p>
        <Button asChild>
          <Link href="/books/new">첫 책 등록하기</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.books.map((book) => (
        <li key={book.id}>
          <Link href={`/books/${book.id}`} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
            <Card>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>
                  {book.author} · {GENRE_LABEL[book.genre]}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
