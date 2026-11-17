// 테스트용 JobRepository. 계약 테스트(src/testing/contracts/)가 Postgres 구현과 같게 붙잡아 둔다.
// 계약에 없는 동작을 넣지 않는다 (ADR-006 §4).
import type { JobRepository } from "@/application/ports";
import type { Job } from "@/domain/job";

export class InMemoryJobRepository implements JobRepository {
  private readonly jobs = new Map<number, Job>();
  private nextId = 1;

  async enqueue(kind: string, payload: unknown): Promise<number> {
    const id = this.nextId++;
    this.jobs.set(id, {
      id,
      kind,
      // DB 에 넣었다 꺼낸 것처럼, 넣은 쪽의 객체와 연결을 끊는다.
      payload: structuredClone(payload),
      status: "queued",
      error: null,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
    });
    return id;
  }

  async findById(id: number): Promise<Job | null> {
    const job = this.jobs.get(id);
    return job ? structuredClone(job) : null;
  }

  async claimNext(): Promise<Job | null> {
    // Map 은 넣은 순서를 지키므로, 처음 만나는 대기 작업이 가장 먼저 넣은 것이다.
    for (const job of this.jobs.values()) {
      if (job.status !== "queued") continue;
      job.status = "running";
      job.startedAt = new Date();
      return structuredClone(job);
    }
    return null;
  }

  async markDone(id: number): Promise<void> {
    this.update(id, { status: "done", error: null, finishedAt: new Date() });
  }

  async markFailed(id: number, error: string): Promise<void> {
    this.update(id, { status: "failed", error, finishedAt: new Date() });
  }

  private update(id: number, patch: Partial<Job>) {
    const job = this.jobs.get(id);
    if (job) Object.assign(job, patch);
  }
}
