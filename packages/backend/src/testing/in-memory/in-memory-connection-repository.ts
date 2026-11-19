// 테스트용 ConnectionRepository. 계약 테스트가 Postgres 구현과 같게 붙잡아 둔다.
import { randomUUID } from "node:crypto";
import type { ConnectionRepository, ConnectionRunOutcome, NewConnectionRun } from "../../application/ports";
import type { CheckedConnection, Connection, ConnectionRun } from "../../domain/connection";

export class InMemoryConnectionRepository implements ConnectionRepository {
  private readonly runs: ConnectionRun[] = [];
  private readonly connections: Connection[] = [];

  async createRun(input: NewConnectionRun): Promise<ConnectionRun> {
    const run: ConnectionRun = {
      ...input,
      id: randomUUID(),
      status: "queued",
      error: null,
      model: null,
      costUsd: 0,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
    };
    this.runs.push(run);
    return structuredClone(run);
  }

  async findRun(id: string): Promise<ConnectionRun | null> {
    const r = this.runs.find((x) => x.id === id);
    return r ? structuredClone(r) : null;
  }

  async latestRun(sessionId: string, interpretationVersion: number): Promise<ConnectionRun | null> {
    const r = this.runs.filter((x) => x.sessionId === sessionId && x.interpretationVersion === interpretationVersion).at(-1);
    return r ? structuredClone(r) : null;
  }

  async markRunRunning(id: string): Promise<void> {
    this.update(id, { status: "running", startedAt: new Date() });
  }

  async markRunDone(id: string, outcome: ConnectionRunOutcome): Promise<void> {
    this.update(id, { ...outcome, status: "done", error: null, finishedAt: new Date() });
  }

  async markRunFailed(id: string, error: string, outcome: ConnectionRunOutcome): Promise<void> {
    this.update(id, { ...outcome, status: "failed", error, finishedAt: new Date() });
  }

  async addConnections(runId: string, sessionId: string, input: CheckedConnection[]): Promise<Connection[]> {
    const added = input.map((c) => ({ ...structuredClone(c), id: randomUUID(), runId, sessionId }));
    this.connections.push(...added);
    return structuredClone(added);
  }

  async listConnections(runId: string): Promise<Connection[]> {
    return this.connections.filter((c) => c.runId === runId).map((c) => structuredClone(c));
  }

  private update(id: string, patch: Partial<ConnectionRun>) {
    const r = this.runs.find((x) => x.id === id);
    if (r) Object.assign(r, patch);
  }
}
