import Link from "next/link";
import { RegisterBookScreen } from "@/features/books/register-book-screen";

export default function NewBookPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 책 목록
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">책 등록</h1>
      <p className="text-muted-foreground">읽은 책의 제목과 작가를 적어 주세요.</p>
      <RegisterBookScreen />
    </div>
  );
}
