"use client";

import { useRouter } from "next/navigation";
import { BookRegisterForm } from "@/features/books/book-register-form";

// 등록이 끝나면 책 정보로 간다. 양식은 이동을 모르게 두어 화면 테스트를 쉽게 한다.
export function RegisterBookScreen() {
  const router = useRouter();
  return <BookRegisterForm onRegistered={(book) => router.push(`/books/${book.id}`)} />;
}
