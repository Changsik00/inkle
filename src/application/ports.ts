// 애플리케이션이 바깥 세계에 기대하는 것 (ADR-006 §2). 구현은 src/infrastructure/ 에 있다.
// 인자와 결과는 도메인 타입이다. SQL, 행, 연결 객체는 여기에 나타나지 않는다.
import type { Job } from "@/domain/job";
import type { User } from "@/domain/user";

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
