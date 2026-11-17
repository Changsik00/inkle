"use client";

import { useEffect, useState } from "react";

type State = "확인 중" | "DB 연결됨" | "DB 에 닿지 못함";

// 화면은 HTTP API 로만 자료를 읽는다 (ADR-001).
export function HealthStatus() {
  const [state, setState] = useState<State>("확인 중");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => res.json())
      .then((body: { db?: string }) => {
        if (!cancelled) setState(body.db === "ok" ? "DB 연결됨" : "DB 에 닿지 못함");
      })
      .catch(() => {
        if (!cancelled) setState("DB 에 닿지 못함");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <p className="text-sm text-zinc-500">{state}</p>;
}
