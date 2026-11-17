import Link from "next/link";
import { BookList } from "@/frontend/features/books/book-list";
import { HealthStatus } from "@/frontend/features/system/health-status";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/shared/product";
import { Button } from "@/frontend/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{PRODUCT_NAME}</h1>
          <p className="text-muted-foreground">{PRODUCT_TAGLINE}</p>
        </div>
        <Button asChild>
          <Link href="/books/new">책 등록</Link>
        </Button>
      </header>
      <section className="flex flex-col gap-3" aria-labelledby="books-heading">
        <h2 id="books-heading" className="text-lg font-medium">
          모임을 열 책
        </h2>
        <BookList />
      </section>
      <footer>
        <HealthStatus />
      </footer>
    </div>
  );
}
