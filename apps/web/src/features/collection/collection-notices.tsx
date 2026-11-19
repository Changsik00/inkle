"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { api } from "@/api-client";
import { Button } from "@/ui/button";

// 책 단위 수집의 상태를 알리는 부분. 배경과 다른 시선이 함께 쓴다 (spec-01-09, spec-01-10).

/** 수집이 진행 중일 때 다시 읽는 간격 */
export const POLL_MS = 3000;

export function Notice({ children, status = true }: { children: ReactNode; status?: boolean }) {
  return (
    <div role={status ? "status" : undefined} className="flex flex-col items-start gap-3 border-l-2 border-rule-strong pl-4">
      {children}
    </div>
  );
}

export function Collecting() {
  return (
    <Notice>
      <p className="text-label">자료를 모으는 중이에요</p>
      <p className="text-body-sm text-muted-foreground">출처를 직접 열어 문장을 확인하느라 몇 분 걸려요. 이 화면은 저절로 바뀌어요.</p>
    </Notice>
  );
}

/** 내 해석 전 (문, phase-01 성공 기준 5) */
export function Locked({ sessionId, what }: { sessionId: string; what: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-body-md text-muted-foreground">내 해석을 먼저 써 주세요. 쓴 뒤에 {what}을 볼 수 있어요.</p>
      <Button asChild>
        <Link href={`/sessions/${sessionId}/interpretation`}>내 해석 쓰기</Link>
      </Button>
    </div>
  );
}

/**
 * 확인하지 못함. 수집이 실패했거나 없으면 다시 모을 수 있다 (canRetry).
 * 다시 모으면 같은 책의 배경과 다른 시선이 함께 바뀌므로 둘 다 다시 읽는다.
 */
export function NotChecked({ sessionId, canRetry, emptyText }: { sessionId: string; canRetry: boolean; emptyText: string }) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState(false);
  const recollect = useMutation({
    ...api.background.recollect.mutationOptions(),
    onSuccess: async () => {
      setProblem(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: api.background.key() }),
        queryClient.invalidateQueries({ queryKey: api.perspectives.key() }),
      ]);
    },
    onError: () => setProblem(true),
  });
  return (
    <Notice status={false}>
      <p className="text-label">확인하지 못했어요</p>
      <p className="text-body-sm text-muted-foreground">{canRetry ? "자료를 모으지 못했어요. 다시 모을 수 있어요." : emptyText}</p>
      {canRetry && (
        <Button variant="outline" disabled={recollect.isPending} onClick={() => recollect.mutate({ sessionId })}>
          다시 모으기
        </Button>
      )}
      {problem && (
        <p role="alert" className="text-body-sm text-destructive">
          다시 모으지 못했어요. 잠시 뒤 다시 시도해 주세요.
        </p>
      )}
    </Notice>
  );
}
