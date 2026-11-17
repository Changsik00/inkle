import { z } from "zod";
import type { JobRepository } from "@/backend/application/ports";
import { JOB_STATUSES, type Job } from "@/backend/domain/job";
import type { Sql } from "@/backend/infrastructure/db/client";

const jobRow = z.object({
  id: z.coerce.number(),
  kind: z.string(),
  payload: z.unknown(),
  status: z.enum(JOB_STATUSES),
  error: z.string().nullable(),
  created_at: z.date(),
  started_at: z.date().nullable(),
  finished_at: z.date().nullable(),
});

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

export class PostgresJobRepository implements JobRepository {
  constructor(private readonly sql: Sql) {}

  async enqueue(kind: string, payload: unknown): Promise<number> {
    const [row] = await this.sql`
      insert into jobs (kind, payload) values (${kind}, ${this.sql.json(payload as never)})
      returning id`;
    return Number(row.id);
  }

  async findById(id: number): Promise<Job | null> {
    const rows = await this.sql`select * from jobs where id = ${id}`;
    return rows.length ? toJob(rows[0]) : null;
  }

  // SKIP LOCKED 로 다른 프로세스가 잡고 있는 행은 건너뛰므로, 같은 작업을 둘이 잡지 않는다.
  async claimNext(): Promise<Job | null> {
    const rows = await this.sql`
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

  async markDone(id: number): Promise<void> {
    await this.sql`update jobs set status = 'done', finished_at = now(), error = null where id = ${id}`;
  }

  async markFailed(id: number, error: string): Promise<void> {
    await this.sql`update jobs set status = 'failed', finished_at = now(), error = ${error} where id = ${id}`;
  }
}
