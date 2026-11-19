import { z } from "zod";
import type { ConnectionRepository, ConnectionRunOutcome, NewConnectionRun } from "../../application/ports";
import { COLLECTION_STATUSES } from "../../domain/collection";
import type { CheckedConnection, Connection, ConnectionRun } from "../../domain/connection";
import type { Sql } from "../db/client";

const runRow = z.object({
  id: z.uuid(),
  session_id: z.uuid(),
  interpretation_version: z.number().int(),
  collection_id: z.uuid(),
  status: z.enum(COLLECTION_STATUSES),
  error: z.string().nullable(),
  model: z.string().nullable(),
  prompt_version: z.string(),
  cost_usd: z.number(),
  created_at: z.date(),
  started_at: z.date().nullable(),
  finished_at: z.date().nullable(),
});

function toRun(raw: unknown): ConnectionRun {
  const r = runRow.parse(raw);
  return {
    id: r.id,
    sessionId: r.session_id,
    interpretationVersion: r.interpretation_version,
    collectionId: r.collection_id,
    status: r.status,
    error: r.error,
    model: r.model,
    promptVersion: r.prompt_version,
    costUsd: r.cost_usd,
    createdAt: r.created_at,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
  };
}

const connectionRow = z.object({
  id: z.uuid(),
  run_id: z.uuid(),
  session_id: z.uuid(),
  background_item_id: z.uuid(),
  my_quote: z.string(),
  question_id: z.string().nullable(),
  note_ko: z.string(),
  verified: z.boolean(),
});

function toConnection(raw: unknown): Connection {
  const r = connectionRow.parse(raw);
  return {
    id: r.id,
    runId: r.run_id,
    sessionId: r.session_id,
    backgroundItemId: r.background_item_id,
    myQuote: r.my_quote,
    questionId: r.question_id,
    noteKo: r.note_ko,
    verified: r.verified,
  };
}

const RUN_COLUMNS =
  "id, session_id, interpretation_version, collection_id, status, error, model, prompt_version, cost_usd, created_at, started_at, finished_at";
const CONNECTION_COLUMNS = "id, run_id, session_id, background_item_id, my_quote, question_id, note_ko, verified";

export class PostgresConnectionRepository implements ConnectionRepository {
  constructor(private readonly sql: Sql) {}

  async createRun(input: NewConnectionRun): Promise<ConnectionRun> {
    const [row] = await this.sql`
      insert into connection_runs (session_id, interpretation_version, collection_id, prompt_version)
      values (${input.sessionId}, ${input.interpretationVersion}, ${input.collectionId}, ${input.promptVersion})
      returning ${this.sql.unsafe(RUN_COLUMNS)}`;
    return toRun(row);
  }

  async findRun(id: string): Promise<ConnectionRun | null> {
    const rows = await this.sql`select ${this.sql.unsafe(RUN_COLUMNS)} from connection_runs where id = ${id}`;
    return rows.length ? toRun(rows[0]) : null;
  }

  async latestRun(sessionId: string, interpretationVersion: number): Promise<ConnectionRun | null> {
    const rows = await this.sql`
      select ${this.sql.unsafe(RUN_COLUMNS)} from connection_runs
      where session_id = ${sessionId} and interpretation_version = ${interpretationVersion}
      order by created_at desc limit 1`;
    return rows.length ? toRun(rows[0]) : null;
  }

  async markRunRunning(id: string): Promise<void> {
    await this.sql`update connection_runs set status = 'running', started_at = clock_timestamp() where id = ${id}`;
  }

  async markRunDone(id: string, outcome: ConnectionRunOutcome): Promise<void> {
    await this.finish(id, "done", null, outcome);
  }

  async markRunFailed(id: string, error: string, outcome: ConnectionRunOutcome): Promise<void> {
    await this.finish(id, "failed", error, outcome);
  }

  private async finish(id: string, status: "done" | "failed", error: string | null, o: ConnectionRunOutcome) {
    await this.sql`
      update connection_runs set status = ${status}, error = ${error}, model = ${o.model}, cost_usd = ${o.costUsd},
        finished_at = clock_timestamp()
      where id = ${id}`;
  }

  async addConnections(runId: string, sessionId: string, input: CheckedConnection[]): Promise<Connection[]> {
    if (!input.length) return [];
    return this.sql.begin(async (tx) => {
      const out: Connection[] = [];
      for (const c of input) {
        const [row] = await tx`
          insert into connections (run_id, session_id, background_item_id, my_quote, question_id, note_ko, verified)
          values (${runId}, ${sessionId}, ${c.backgroundItemId}, ${c.myQuote}, ${c.questionId}, ${c.noteKo}, ${c.verified})
          returning ${tx.unsafe(CONNECTION_COLUMNS)}`;
        out.push(toConnection(row));
      }
      return out;
    }) as Promise<Connection[]>;
  }

  async listConnections(runId: string): Promise<Connection[]> {
    const rows = await this.sql`
      select ${this.sql.unsafe(CONNECTION_COLUMNS)} from connections where run_id = ${runId} order by seq`;
    return rows.map(toConnection);
  }
}
