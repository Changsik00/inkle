import Link from "next/link";
import { RegisterBookScreen } from "@/features/books/register-book-screen";

export default function NewBookPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-caption text-muted-foreground hover:text-foreground">
        ← 책 목록
      </Link>
      <h1 className="text-heading-1">책 등록</h1>
      <p className="text-body-sm text-muted-foreground">읽은 책의 제목과 작가를 적어 주세요.</p>
      <RegisterBookScreen />
    </div>
  );
}
