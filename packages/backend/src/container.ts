// 조립 (ADR-006 §3). 실제 구현을 만드는 유일한 곳이다. 진입점은 여기서 받은 것을 유스케이스에 넘긴다.
import type {
  BookRepository,
  HealthProbe,
  InterpretationRepository,
  JobRepository,
  SessionRepository,
  UserRepository,
} from "./application/ports";
import { getSql } from "./infrastructure/db/client";
import { PostgresBookRepository } from "./infrastructure/repositories/postgres-book-repository";
import { PostgresHealthProbe } from "./infrastructure/repositories/postgres-health-probe";
import {
  PostgresInterpretationRepository,
  PostgresSessionRepository,
} from "./infrastructure/repositories/postgres-session-repository";
import { PostgresJobRepository } from "./infrastructure/repositories/postgres-job-repository";
import { PostgresUserRepository } from "./infrastructure/repositories/postgres-user-repository";

export type Container = {
  healthProbe: HealthProbe;
  users: UserRepository;
  jobs: JobRepository;
  books: BookRepository;
  sessions: SessionRepository;
  interpretations: InterpretationRepository;
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
    close: () => sql.end(),
  };
}
