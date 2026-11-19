// 조립 (ADR-006 §3). 실제 구현을 만드는 유일한 곳이다. 진입점은 여기서 받은 것을 유스케이스에 넘긴다.
import type { CollectDeps } from "./application/collection";
import type {
  BookRepository,
  CollectionRepository,
  HealthProbe,
  InterpretationRepository,
  JobRepository,
  SessionRepository,
  UserRepository,
} from "./application/ports";
import { getSql } from "./infrastructure/db/client";
import { ClaudeCodeCli } from "./infrastructure/llm/claude-code-cli";
import { PostgresCollectionRepository } from "./infrastructure/repositories/postgres-collection-repository";
import { PostgresBookRepository } from "./infrastructure/repositories/postgres-book-repository";
import { PostgresHealthProbe } from "./infrastructure/repositories/postgres-health-probe";
import {
  PostgresInterpretationRepository,
  PostgresSessionRepository,
} from "./infrastructure/repositories/postgres-session-repository";
import { PostgresJobRepository } from "./infrastructure/repositories/postgres-job-repository";
import { PostgresUserRepository } from "./infrastructure/repositories/postgres-user-repository";
import { HttpPageFetcher } from "./infrastructure/web/http-page-fetcher";

export type Container = {
  healthProbe: HealthProbe;
  users: UserRepository;
  jobs: JobRepository;
  books: BookRepository;
  sessions: SessionRepository;
  interpretations: InterpretationRepository;
  collections: CollectionRepository;
  /** 명령과 작업 프로세스가 끝날 때 DB 연결을 닫는다. 웹 앱은 부르지 않는다. */
  close(): Promise<void>;
};

export function container(): Container {
  const sql = getSql();
  return {
    healthProbe: new PostgresHealthProbe(sql),
    users: new PostgresUserRepository(sql),
    jobs: new PostgresJobRepository(sql),
    books: new PostgresBookRepository(sql),
    sessions: new PostgresSessionRepository(sql),
    interpretations: new PostgresInterpretationRepository(sql),
    collections: new PostgresCollectionRepository(sql),
    close: () => sql.end(),
  };
}

/**
 * 자료 수집에 쓰는 것. 작업 프로세스(호스트)만 부른다: CLI 는 기기에 로그인된 구독으로 실행한다 (ADR-004 §1).
 * INKLE_LLM_MODEL 로 모델을 정할 수 있다. 없으면 CLI 의 기본 모델.
 */
export function collector(c: Container): CollectDeps {
  return {
    books: c.books,
    collections: c.collections,
    llm: new ClaudeCodeCli({ model: process.env.INKLE_LLM_MODEL || undefined }),
    pages: new HttpPageFetcher(),
  };
}
