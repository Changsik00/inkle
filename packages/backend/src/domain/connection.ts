// 연결 (ADR-002 독자 단위). 책 단위로 모은 배경 항목 하나가 내 해석의 어느 부분과 맞닿는지.
// 내 해석의 판 하나에 대해 만든다. 다시 만들어도 이전 것은 지우지 않는다 (ADR-005 파생물).
// 근거는 내 답에서 그대로 옮긴 구절이고, 출처 인용과 같은 규칙으로 대조한다 (ADR-004 §2).
import type { Answer } from "./interpretation";
import { BACKGROUND_TOPICS, type BackgroundTopic, type CollectionStatus } from "./collection";
import { matchQuote } from "./quote-match";

/** 연결 만들기의 상태. 수집과 같은 전이를 쓴다 (대기 → 진행 중 → 끝남 / 실패). */
export type ConnectionRunStatus = CollectionStatus;

export type ConnectionRun = {
  id: string;
  sessionId: string;
  interpretationVersion: number;
  /** 연결의 재료가 된 수집 */
  collectionId: string;
  status: ConnectionRunStatus;
  error: string | null;
  model: string | null;
  promptVersion: string;
  costUsd: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type Connection = {
  id: string;
  runId: string;
  sessionId: string;
  backgroundItemId: string;
  /** 내 답에서 옮긴 구절. 글쓴이는 나 */
  myQuote: string;
  /** 구절이 있는 질문. 대조에 실패했으면 null */
  questionId: string | null;
  /** 어떻게 맞닿는지 한 줄. 글쓴이는 AI */
  noteKo: string;
  verified: boolean;
};

/** 한 번에 만드는 연결의 상한. 수동 실험에서 3~5개였다. */
export const MAX_CONNECTIONS = 5;

export type ProposedConnection = { backgroundItemId: string; myQuote: string; noteKo: string };
export type CheckedConnection = ProposedConnection & { questionId: string | null; verified: boolean };

/**
 * LLM 이 낸 연결을 확인한다. 넘겨준 배경 목록에 없는 번호는 버리고, 같은 배경은 처음 것만,
 * 많아야 MAX_CONNECTIONS 개. 구절이 내 답 가운데 하나에 그대로 있어야 통과한다.
 */
export function checkConnections(
  proposed: ProposedConnection[],
  answers: Answer[],
  allowedBackgroundItemIds: string[],
): CheckedConnection[] {
  const allowed = new Set(allowedBackgroundItemIds);
  const seen = new Set<string>();
  const out: CheckedConnection[] = [];
  for (const p of proposed) {
    if (out.length >= MAX_CONNECTIONS) break;
    if (!allowed.has(p.backgroundItemId) || seen.has(p.backgroundItemId)) continue;
    seen.add(p.backgroundItemId);
    const found = answers.find((a) => matchQuote(p.myQuote, a.text).verified);
    out.push({ ...p, questionId: found?.questionId ?? null, verified: Boolean(found) });
  }
  return out;
}

export type Arranged<T, C> = {
  /** 대조를 통과한 연결이 있는 배경, 연결 순서대로 */
  connected: { item: T; connection: C }[];
  /** 나머지, 주제 순서로. 빈 주제는 없다 */
  others: { topic: BackgroundTopic; items: T[] }[];
};

/** 배경 화면의 배치: 내 해석과 맞닿는 배경을 위에, 나머지는 주제별로. */
export function arrangeBackground<T extends { id: string; topic: BackgroundTopic }, C extends Pick<Connection, "backgroundItemId" | "verified">>(
  items: T[],
  connections: C[],
): Arranged<T, C> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const connected: Arranged<T, C>["connected"] = [];
  const used = new Set<string>();
  for (const c of connections) {
    const item = byId.get(c.backgroundItemId);
    if (!c.verified || !item || used.has(item.id)) continue;
    used.add(item.id);
    connected.push({ item, connection: c });
  }
  const others = BACKGROUND_TOPICS.map((topic) => ({
    topic,
    items: items.filter((i) => i.topic === topic && !used.has(i.id)),
  })).filter((g) => g.items.length > 0);
  return { connected, others };
}
