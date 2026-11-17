"use client";

import { useParams } from "next/navigation";
import { BookDetail } from "@/frontend/features/books/book-detail";

// 페이지는 자료를 읽지 않는 틀이다 (ADR-007 §1). 주소의 bookId 는 여기서 읽는다.
export function BookDetailScreen() {
  const { bookId } = useParams<{ bookId: string }>();
  return <BookDetail bookId={bookId} />;
}
