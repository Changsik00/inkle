// 작업 대기열의 작업 (ADR-001 §3).
export const JOB_STATUSES = ["queued", "running", "done", "failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type Job = {
  id: number;
  kind: string;
  payload: unknown;
  status: JobStatus;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};
