import Link from "next/link";
import { BookList } from "@/features/books/book-list";
import { HealthStatus } from "@/features/system/health-status";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/product";
import { Button } from "@/ui/button";

// 제품 이름은 작게, 화면 제목이 먼저 보이게 (DESIGN.md §Layout).
export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <p className="font-serif text-title-book">{PRODUCT_NAME}</p>
        <Button asChild>
          <Link href="/books/new">책 등록</Link>
        </Button>
      </header>
      <section className="flex flex-col gap-2" aria-labelledby="books-heading">
        <h1 id="books-heading" className="text-heading-1">
          모임을 열 책
        </h1>
        <p className="text-body-sm text-muted-foreground">{PRODUCT_TAGLINE}. 읽은 책을 골라 내 해석부터 적어 보세요.</p>
        <div className="mt-4">
          <BookList />
        </div>
      </section>
      <footer className="mt-auto">
        <HealthStatus />
      </footer>
    </div>
  );
}
