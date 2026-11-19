import { Suspense } from "react";
import { BackgroundScreen } from "@/features/background/background-screen";

// 모임의 단계마다 주소를 둔다 (ADR-007 §1). 주소의 값을 읽는 부분은 Suspense 안에 둔다 (Cache Components).
export default function BackgroundPage() {
  return (
    <Suspense fallback={<p className="text-body-sm text-muted-foreground">불러오는 중…</p>}>
      <BackgroundScreen />
    </Suspense>
  );
}
