"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/api-client";

// 개발 중 확인용 표시. 화면은 HTTP API 로만 자료를 읽는다 (ADR-001 §4).
export function HealthStatus() {
  const { data, isPending } = useQuery({ ...api.health.check.queryOptions(), retry: false });
  const text = isPending ? "확인 중" : data?.db === "ok" ? "DB 연결됨" : "DB 에 닿지 못함";
  return <p className="text-caption text-muted-foreground">{text}</p>;
}
