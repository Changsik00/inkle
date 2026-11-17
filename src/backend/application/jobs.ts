import type { JobRepository } from "@/backend/application/ports";
import type { Job } from "@/backend/domain/job";

export type JobHandler = (job: Job) => Promise<void>;
export type JobHandlers = Record<string, JobHandler>;

export function enqueueJob(jobs: JobRepository, kind: string, payload: unknown): Promise<number> {
  return jobs.enqueue(kind, payload);
}

export function getJob(jobs: JobRepository, id: number): Promise<Job | null> {
  return jobs.findById(id);
}

// 작업 하나를 가져가 종류에 맞는 처리기로 처리한다. 처리한 작업의 번호를, 없으면 null 을 돌려준다.
export async function runNextJob(jobs: JobRepository, handlers: JobHandlers): Promise<number | null> {
  const job = await jobs.claimNext();
  if (!job) return null;

  const handler = Object.hasOwn(handlers, job.kind) ? handlers[job.kind] : undefined;
  if (!handler) {
    await jobs.markFailed(job.id, `등록되지 않은 작업 종류: ${job.kind}`);
    return job.id;
  }

  try {
    await handler(job);
    await jobs.markDone(job.id);
  } catch (e) {
    await jobs.markFailed(job.id, e instanceof Error ? e.message : String(e));
  }
  return job.id;
}
