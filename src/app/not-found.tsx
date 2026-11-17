import Link from "next/link";
import { Button } from "@/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">페이지를 찾을 수 없어요</h1>
      <Button asChild variant="outline">
        <Link href="/">책 목록으로</Link>
      </Button>
    </div>
  );
}
