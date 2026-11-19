import { Suspense } from "react";
import { PerspectivesScreen } from "@/features/perspectives/perspectives-screen";

// 모임의 단계마다 주소를 둔다 (ADR-007 §1). 주소의 값을 읽는 부분은 Suspense 안에 둔다 (Cache Components).
export default function PerspectivesPage() {
  return (
    <Suspense fallback={<p className="text-body-sm text-muted-foreground">불러오는 중…</p>}>
      <PerspectivesScreen />
    </Suspense>
  );
}
