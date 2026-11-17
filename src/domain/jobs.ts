import { z } from "zod";
import type { Sql } from "@/db/client";

// 작업 대기열 (ADR-001 §3). 웹 앱이 넣고, 작업 프로세스가 가져가 처리한다.

const jobRow = z.object({
  id: z.coerce.number(),
  kind: z.string(),
  payload: z.unknown(),
  status: z.enum(["queued", "running", "done", "failed"]),
  error: z.string().nullable(),
  created_at: z.date(),
  started_at: z.date().nullable(),
  finished_at: z.date().nullable(),
});

export type Job = {
  id: number;
  kind: string;
  payload: unknown;
  status: "queued" | "running" | "done" | "failed";
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type JobHandler = (job: Job) => Promise<void>;
export type JobHandlers = Record<string, JobHandler>;

function toJob(raw: unknown): Job {
  const r = jobRow.parse(raw);
  return {
    id: r.id,
    kind: r.kind,
    payload: r.payload,
    status: r.status,
    error: r.error,
    createdAt: r.created_at,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
  };
}

export async function enqueueJob(sql: Sql, kind: string, payload: unknown): Promise<number> {
  const [row] = await sql`
    insert into jobs (kind, payload) values (${kind}, ${sql.json(payload as never)})
    returning id`;
  return Number(row.id);
}

export async function getJob(sql: Sql, id: number): Promise<Job | null> {
  const rows = await sql`select * from jobs where id = ${id}`;
  return rows.length ? toJob(rows[0]) : null;
}

// 가장 먼저 넣은 대기 작업 하나를 진행 중으로 바꿔 가져간다.
// SKIP LOCKED 로 다른 프로세스가 잡고 있는 행은 건너뛰므로, 같은 작업을 둘이 잡지 않는다.
export async function claimJob(sql: Sql): Promise<Job | null> {
  const rows = await sql`
    update jobs set status = 'running', started_at = now()
    where id = (
      select id from jobs where status = 'queued'
      order by created_at, id
      for update skip locked
      limit 1
    )
    returning *`;
  return rows.length ? toJob(rows[0]) : null;
}

export async function completeJob(sql: Sql, id: number): Promise<void> {
  await sql`update jobs set status = 'done', finished_at = now(), error = null where id = ${id}`;
}

export async function failJob(sql: Sql, id: number, error: string): Promise<void> {
  await sql`update jobs set status = 'failed', finished_at = now(), error = ${error} where id = ${id}`;
}

// 작업 하나를 가져가 종류에 맞는 처리기로 처리한다. 처리한 작업의 번호를, 없으면 null 을 돌려준다.
export async function runNextJob(sql: Sql, handlers: JobHandlers): Promise<number | null> {
  const job = await claimJob(sql);
  if (!job) return null;

  const handler = Object.hasOwn(handlers, job.kind) ? handlers[job.kind] : undefined;
  if (!handler) {
    await failJob(sql, job.id, `등록되지 않은 작업 종류: ${job.kind}`);
    return job.id;
  }

  try {
    await handler(job);
    await completeJob(sql, job.id);
  } catch (e) {
    await failJob(sql, job.id, e instanceof Error ? e.message : String(e));
  }
  return job.id;
}
