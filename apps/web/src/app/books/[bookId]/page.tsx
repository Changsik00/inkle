import Link from "next/link";
import { Suspense } from "react";
import { BookDetailScreen } from "@/features/books/book-detail-screen";

// 주소의 값(bookId)을 읽는 부분은 Suspense 안에 둔다. 그래야 틀을 미리 그릴 수 있다 (Cache Components).
export default function BookPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-caption text-muted-foreground hover:text-foreground">
        ← 책 목록
      </Link>
      <Suspense fallback={<p className="text-body-sm text-muted-foreground">불러오는 중…</p>}>
        <BookDetailScreen />
      </Suspense>
    </div>
  );
}
