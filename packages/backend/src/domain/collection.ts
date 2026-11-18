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

/** 대기·진행 중·끝남이 있으면 같은 책을 또 모으지 않는다. 실패만 있으면 다시 모은다. */
export function blocksNewCollection(status: CollectionStatus): boolean {
  return status !== "failed";
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
