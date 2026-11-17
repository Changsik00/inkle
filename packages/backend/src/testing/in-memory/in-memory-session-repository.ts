// 테스트용 SessionRepository, InterpretationRepository. 계약 테스트가 Postgres 구현과 같게 붙잡아 둔다.
import { randomUUID } from "node:crypto";
import type { InterpretationRepository, SessionRepository } from "../../application/ports";
import type { Answer, Interpretation } from "../../domain/interpretation";
import type { Session } from "../../domain/session";

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions: Session[] = [];

  async create(input: { userId: string; bookId: string }): Promise<Session> {
    const session: Session = { id: randomUUID(), userId: input.userId, bookId: input.bookId, createdAt: new Date() };
    this.sessions.push(session);
    return structuredClone(session);
  }

  async findForUser(id: string, userId: string): Promise<Session | null> {
    const s = this.sessions.find((x) => x.id === id && x.userId === userId);
    return s ? structuredClone(s) : null;
  }

  async listForBook(bookId: string, userId: string): Promise<Session[]> {
    return this.sessions
      .filter((x) => x.bookId === bookId && x.userId === userId)
      .map((x) => structuredClone(x))
      .reverse();
  }
}

export class InMemoryInterpretationRepository implements InterpretationRepository {
  private readonly versions: Interpretation[] = [];

  async appendVersion(input: { sessionId: string; questionSetId: string; answers: Answer[] }): Promise<Interpretation> {
    const last = this.versions.filter((v) => v.sessionId === input.sessionId).at(-1);
    const v: Interpretation = {
      sessionId: input.sessionId,
      version: (last?.version ?? 0) + 1,
      questionSetId: input.questionSetId,
      answers: structuredClone(input.answers),
      author: "me",
      createdAt: new Date(),
    };
    this.versions.push(v);
    return structuredClone(v);
  }

  async latest(sessionId: string): Promise<Interpretation | null> {
    const v = this.versions.filter((x) => x.sessionId === sessionId).at(-1);
    return v ? structuredClone(v) : null;
  }

  async listVersions(sessionId: string): Promise<Interpretation[]> {
    return this.versions.filter((x) => x.sessionId === sessionId).map((x) => structuredClone(x));
  }
}
