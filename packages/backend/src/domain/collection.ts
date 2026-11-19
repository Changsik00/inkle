// 자료 수집 (ADR-004). 배경과 다른 시선은 책 단위로 모으고 독자와 무관하다 (ADR-002 §1).
// 설명·요약·옮김은 AI 가, 인용 원문은 바깥 사람이 썼다 (ADR-002 §3). 모든 항목은 어느 수집에서
// 어느 모델과 지시문 판으로 만들었는지 갖는다 (ADR-005).

export const COLLECTION_STATUSES = ["queued", "running", "done", "failed"] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export type Collection = {
  id: string;
  bookId: string;
  status: CollectionStatus;
  error: string | null;
  /** 각 단계가 쓴 모델 (CLI 가 알려 준 이름) */
  models: string[];
  /** 단계 → 지시문 판, 예: { find: "find.v1" } */
  promptVersions: Record<string, string>;
  /** CLI 가 보고한 비용 추정치의 합 (달러) */
  costUsd: number;
  /** 찾기 단계가 낸 후보 수 */
  candidateCount: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

const TRANSITIONS: Record<CollectionStatus, CollectionStatus[]> = {
  queued: ["running"],
  running: ["done", "failed"],
  done: [],
  failed: [],
};

export function canTransition(from: CollectionStatus, to: CollectionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * 대기·진행 중이 이만큼 지나도 끝나지 않으면 멈춘 것으로 본다 (작업 프로세스가 죽었거나 작업이 버려졌다).
 * 한 수집은 CLI 호출 열 번 남짓이고 호출마다 5분 제한이라 이보다 길지 않다.
 */
export const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

/** 끝난 수집, 멈추지 않은 대기·진행 중 수집이 있으면 같은 책을 또 모으지 않는다. 실패만 있으면 다시 모은다. */
export function blocksNewCollection(c: Pick<Collection, "status" | "createdAt" | "startedAt">, now: Date): boolean {
  if (c.status === "done") return true;
  if (c.status === "failed") return false;
  const since = (c.startedAt ?? c.createdAt).getTime();
  return now.getTime() - since < STALE_AFTER_MS;
}

export const SOURCE_ROLES = ["background", "perspective", "both"] as const;
export type SourceRole = (typeof SOURCE_ROLES)[number];

export type Source = {
  id: string;
  collectionId: string;
  bookId: string;
  url: string;
  finalUrl: string | null;
  /** 누가 한 말인지 (찾기 단계가 낸 것) */
  who: string;
  role: SourceRole;
  fetchStatus: "ok" | "unreachable";
  fetchError: string | null;
  /** 페이지 전체 글자. 대조는 이것과 한다 */
  pageText: string | null;
  /** 본문만 뽑은 글자. 읽기 단계에 넘긴다 */
  articleText: string | null;
  /** 읽기 단계가 실패했으면 그 이유. 이 출처에서는 항목이 없다 */
  readError: string | null;
  fetchedAt: Date;
};

export const QUOTE_SOURCE_KINDS = ["direct", "editorial", "requote"] as const;
/** 직접 인용 / 편집자·기자의 정리 / 다른 글을 다시 인용 (ADR-004 §3) */
export type QuoteSourceKind = (typeof QUOTE_SOURCE_KINDS)[number];

export type Quote = {
  id: string;
  sourceId: string;
  /** 원문 그대로. 글쓴이는 바깥 사람 */
  text: string;
  lang: string;
  /** 한국어가 아닌 인용의 한국어 옮김. 글쓴이는 AI */
  translationKo: string | null;
  sourceKind: QuoteSourceKind;
  verified: boolean;
};

export const BACKGROUND_TOPICS = ["era", "author_life", "author_intent", "other"] as const;
export type BackgroundTopic = (typeof BACKGROUND_TOPICS)[number];

export type Provenance = { collectionId: string; model: string; promptVersion: string };

export type BackgroundItem = Provenance & {
  id: string;
  bookId: string;
  sourceId: string;
  topic: BackgroundTopic;
  /** AI 가 쓴 한국어 설명 */
  claimKo: string;
  quotes: Quote[];
};

export const PERSPECTIVE_ROLES = ["critic", "author", "reader", "other"] as const;
export type PerspectiveRole = (typeof PERSPECTIVE_ROLES)[number];

export const PREVALENCES = ["majority", "some", "rare", "unknown"] as const;
/** 다수 의견 / 일부 / 드문 읽기 / 알 수 없음 (ADR-002 §2) */
export type Prevalence = (typeof PREVALENCES)[number];

export type Perspective = Provenance & {
  id: string;
  bookId: string;
  sourceId: string;
  who: string;
  role: PerspectiveRole;
  /** AI 가 쓴 한국어 요약 */
  readingKo: string;
  prevalence: Prevalence;
  quotes: Quote[];
};

/**
 * AI 가 만든 해석 (ADR-004 §6, ADR-002 §2). 실제 사람의 시선이 모자랄 때만 덧붙인다.
 * 출처와 인용이 없고 글쓴이는 AI 다. 흔함 정도는 언제나 알 수 없음이라 갖지 않는다.
 */
export type ImaginedPerspective = Provenance & {
  id: string;
  bookId: string;
  /** AI 가 쓴 한국어 읽기 */
  readingKo: string;
};

/** 대조를 통과한 인용이 하나라도 있어야 화면에 보여 줄 수 있다 (phase-01 성공 기준 4). */
export function isShowable(item: { quotes: Pick<Quote, "verified">[] }): boolean {
  return item.quotes.some((q) => q.verified);
}

/** 이보다 적은 시선으로는 "다수 의견"을 말할 수 없다. */
export const MIN_PERSPECTIVES_FOR_PREVALENCE = 3;

/**
 * 보여 줄 수 있는 시선들에 흔한 읽기인지를 붙인다. 시선이 적으면 모두 알 수 없음.
 * 라벨을 붙이지 못한 시선도 알 수 없음이고, 목록에 없는 시선의 값은 버린다.
 */
export function applyPrevalence(
  perspectiveIds: string[],
  labels: Record<string, Prevalence>,
): Record<string, Prevalence> {
  const enough = perspectiveIds.length >= MIN_PERSPECTIVES_FOR_PREVALENCE;
  return Object.fromEntries(
    perspectiveIds.map((id) => [id, enough && Object.hasOwn(labels, id) ? labels[id] : "unknown"]),
  );
}

// ── 흔함 정도는 다른 사람의 읽기에만 (spec-01-10). 작가 본인의 말이 흔한 읽기인지는 뜻이 없다.

/** 화면에 내줄 흔함 정도. 작가 본인이면 없음 (저장된 값이 있어도). */
export function prevalenceOf(p: Pick<Perspective, "role" | "prevalence">): Prevalence | null {
  return p.role === "author" ? null : p.prevalence;
}

/** 흔함을 매길 시선: 보여 줄 수 있고 작가 본인이 아닌 것. "다수 의견"을 말할 개수도 이것으로 센다. */
export function prevalenceTargets<T extends Pick<Perspective, "role"> & { quotes: Pick<Quote, "verified">[] }>(perspectives: T[]): T[] {
  return perspectives.filter((p) => p.role !== "author" && isShowable(p));
}

/** 다른 사람(작가 본인 제외)의 시선이 이보다 적으면 AI 가 만든 해석을 덧붙인다 (ADR-004 §6). */
export const MIN_REAL_PERSPECTIVES = 3;

/** 덧붙일 AI 가 만든 해석의 수. 다른 사람의 시선이 기준에 닿도록 모자란 만큼. */
export function needsImagined(otherPerspectiveCount: number): number {
  return Math.max(0, MIN_REAL_PERSPECTIVES - otherPerspectiveCount);
}

const PREVALENCE_ORDER: Record<Prevalence, number> = { majority: 0, some: 1, rare: 2, unknown: 3 };

/** 화면 배치: 다른 사람은 흔한 것부터(같은 값 안에서는 받은 순서), 작가 본인은 따로. */
export function arrangePerspectives<T extends Pick<Perspective, "role" | "prevalence">>(
  perspectives: T[],
): { others: T[]; author: T[] } {
  const others = perspectives
    .filter((p) => p.role !== "author")
    .map((p, i) => ({ p, i }))
    .sort((a, b) => PREVALENCE_ORDER[a.p.prevalence] - PREVALENCE_ORDER[b.p.prevalence] || a.i - b.i)
    .map(({ p }) => p);
  return { others, author: perspectives.filter((p) => p.role === "author") };
}
