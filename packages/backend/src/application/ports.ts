// 애플리케이션이 바깥 세계에 기대하는 것 (ADR-006 §2). 구현은 src/infrastructure/ 에 있다.
// 인자와 결과는 도메인 타입이다. SQL, 행, 연결 객체는 여기에 나타나지 않는다.
import type { Book, Genre } from "../domain/book";
import type {
  BackgroundItem,
  BackgroundTopic,
  Collection,
  ImaginedPerspective,
  Perspective,
  PerspectiveRole,
  Prevalence,
  Provenance,
  Quote,
  Source,
} from "../domain/collection";
import type { CheckedConnection, Connection, ConnectionRun } from "../domain/connection";
import type { Answer, Interpretation } from "../domain/interpretation";
import type { Job } from "../domain/job";
import type { Session } from "../domain/session";
import type { User } from "../domain/user";

export interface HealthProbe {
  isDatabaseReachable(): Promise<boolean>;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
}

export interface JobRepository {
  /** 작업을 대기 상태로 넣고 번호를 돌려준다. */
  enqueue(kind: string, payload: unknown): Promise<number>;
  findById(id: number): Promise<Job | null>;
  /** 가장 먼저 넣은 대기 작업 하나를 진행 중으로 바꿔 돌려준다. 동시에 불려도 같은 작업을 둘에게 주지 않는다. */
  claimNext(): Promise<Job | null>;
  markDone(id: number): Promise<void>;
  markFailed(id: number, error: string): Promise<void>;
}

export type NewBook = { title: string; author: string; genre: Genre; key: string };

/** 같은 키(같은 책)가 이미 있을 때 BookRepository.create 가 던진다. */
export class DuplicateBookError extends Error {
  constructor(readonly key: string) {
    super("같은 책이 이미 있다");
    this.name = "DuplicateBookError";
  }
}

export interface BookRepository {
  /** 같은 키가 있으면 DuplicateBookError 를 던진다. */
  create(book: NewBook): Promise<Book>;
  findById(id: string): Promise<Book | null>;
  findByKey(key: string): Promise<Book | null>;
  /** 최근에 등록한 책부터 */
  list(): Promise<Book[]>;
}

export interface SessionRepository {
  create(input: { userId: string; bookId: string }): Promise<Session>;
  /** 그 사용자의 모임만 찾는다. 다른 사용자의 모임이면 null (ADR-003). */
  findForUser(id: string, userId: string): Promise<Session | null>;
  /** 그 사용자가 이 책으로 연 모임, 최근 순 */
  listForBook(bookId: string, userId: string): Promise<Session[]>;
  /** 이 책으로 연 모든 사용자의 모임. 작업 프로세스만 쓴다 (수집이 끝나면 연결을 넣으려고). 화면에 내주지 않는다 */
  listByBook(bookId: string): Promise<Session[]>;
}

export interface InterpretationRepository {
  /** 새 판을 덧붙인다. 판 번호는 그 모임의 마지막 판 + 1 (ADR-005: 고치지 않고 덧붙이기만) */
  appendVersion(input: { sessionId: string; questionSetId: string; answers: Answer[] }): Promise<Interpretation>;
  latest(sessionId: string): Promise<Interpretation | null>;
  /** 모든 판, 오래된 순 */
  listVersions(sessionId: string): Promise<Interpretation[]>;
}

// ── 자료 수집 (ADR-004)

/** LLM 이 쓸 수 있는 도구. 찾기 단계만 웹 검색을 쓴다 (ADR-004 §2). */
export type LlmTools = "web-search" | "none";

export type LlmCall = {
  prompt: string;
  /** 결과 형식. JSON 스키마 */
  jsonSchema: Record<string, unknown>;
  tools: LlmTools;
};

/** output 은 아직 검사하지 않은 값이다. 형식이 없으면 null. 부른 쪽이 다시 검사한다. */
export type LlmResult = { output: unknown; costUsd: number; model: string };

/** LLM 을 부르는 경계 (ADR-004 §1). 실패(종료 코드, 시간 초과, 오류 응답)는 던진다. */
export interface LlmClient {
  run(call: LlmCall): Promise<LlmResult>;
}

export type FetchedPage =
  | { status: "ok"; finalUrl: string; pageText: string; articleText: string }
  | { status: "unreachable"; reason: string };

/** 출처 페이지를 앱이 직접 연다 (ADR-004 §2 의 2단계). 접근 제한을 우회하지 않는다. */
export interface PageFetcher {
  fetch(url: string): Promise<FetchedPage>;
}

export type NewSource = Omit<Source, "id" | "fetchedAt">;
export type NewQuote = Omit<Quote, "id" | "sourceId">;
export type NewBackgroundItem = Provenance & {
  bookId: string;
  sourceId: string;
  topic: BackgroundTopic;
  claimKo: string;
  quotes: NewQuote[];
};
export type NewPerspective = Provenance & {
  bookId: string;
  sourceId: string;
  who: string;
  role: PerspectiveRole;
  readingKo: string;
  quotes: NewQuote[];
};
export type NewImaginedPerspective = Omit<ImaginedPerspective, "id">;
export type CollectionOutcome = Pick<Collection, "models" | "promptVersions" | "costUsd" | "candidateCount">;

export interface CollectionRepository {
  /** 대기 상태로 만든다 */
  create(bookId: string): Promise<Collection>;
  findById(id: string): Promise<Collection | null>;
  /** 그 책의 가장 최근 수집 */
  latestForBook(bookId: string): Promise<Collection | null>;
  markRunning(id: string): Promise<void>;
  markDone(id: string, outcome: CollectionOutcome): Promise<void>;
  markFailed(id: string, error: string, outcome: CollectionOutcome): Promise<void>;

  addSource(source: NewSource): Promise<Source>;
  /** 넣은 순서대로 */
  listSources(collectionId: string): Promise<Source[]>;
  /** 인용과 함께 넣는다 */
  addBackgroundItem(item: NewBackgroundItem): Promise<BackgroundItem>;
  addPerspective(item: NewPerspective): Promise<Perspective>;
  /** 처음 넣을 때 흔한 읽기는 알 수 없음이다. 나중에 붙인다 */
  setPrevalence(perspectiveId: string, prevalence: Prevalence): Promise<void>;
  /** 인용 포함, 넣은 순서대로 */
  listBackgroundItems(collectionId: string): Promise<BackgroundItem[]>;
  /** 외부 사람의 시선만 (AI 가 만든 해석은 빼고) */
  listPerspectives(collectionId: string): Promise<Perspective[]>;
  addImaginedPerspective(item: NewImaginedPerspective): Promise<ImaginedPerspective>;
  /** 넣은 순서대로 */
  listImaginedPerspectives(collectionId: string): Promise<ImaginedPerspective[]>;
}

// ── 연결 (ADR-002 독자 단위)

export type NewConnectionRun = Pick<ConnectionRun, "sessionId" | "interpretationVersion" | "collectionId" | "promptVersion">;
export type ConnectionRunOutcome = { model: string | null; costUsd: number };

export interface ConnectionRepository {
  /** 대기 상태로 만든다 */
  createRun(input: NewConnectionRun): Promise<ConnectionRun>;
  findRun(id: string): Promise<ConnectionRun | null>;
  /** 이 모임의 이 판으로 만든 가장 최근 연결 만들기 (수집과 무관) */
  latestRun(sessionId: string, interpretationVersion: number): Promise<ConnectionRun | null>;
  markRunRunning(id: string): Promise<void>;
  markRunDone(id: string, outcome: ConnectionRunOutcome): Promise<void>;
  markRunFailed(id: string, error: string, outcome: ConnectionRunOutcome): Promise<void>;
  /** 넣은 순서대로 남는다 */
  addConnections(runId: string, sessionId: string, connections: CheckedConnection[]): Promise<Connection[]>;
  /** 대조에 실패한 것도 포함, 넣은 순서대로 */
  listConnections(runId: string): Promise<Connection[]>;
}
