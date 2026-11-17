import postgres from "postgres";
import { z } from "zod";
import type { InterpretationRepository, SessionRepository } from "../../application/ports";
import type { Answer, Interpretation } from "../../domain/interpretation";
import type { Session } from "../../domain/session";
import type { Sql } from "../db/client";

const sessionRow = z.object({ id: z.uuid(), user_id: z.uuid(), book_id: z.uuid(), created_at: z.date() });

function toSession(raw: unknown): Session {
  const r = sessionRow.parse(raw);
  return { id: r.id, userId: r.user_id, bookId: r.book_id, createdAt: r.created_at };
}

export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly sql: Sql) {}

  async create(input: { userId: string; bookId: string }): Promise<Session> {
    const [row] = await this.sql`
      insert into sessions (user_id, book_id) values (${input.userId}, ${input.bookId})
      returning id, user_id, book_id, created_at`;
    return toSession(row);
  }

  async findForUser(id: string, userId: string): Promise<Session | null> {
    const rows = await this.sql`
      select id, user_id, book_id, created_at from sessions where id = ${id} and user_id = ${userId}`;
    return rows.length ? toSession(rows[0]) : null;
  }

  async listForBook(bookId: string, userId: string): Promise<Session[]> {
    const rows = await this.sql`
      select id, user_id, book_id, created_at from sessions
      where book_id = ${bookId} and user_id = ${userId}
      order by created_at desc, id`;
    return rows.map(toSession);
  }
}

const interpretationRow = z.object({
  session_id: z.uuid(),
  version: z.number().int(),
  question_set: z.string(),
  answers: z.array(z.object({ questionId: z.string(), text: z.string() })),
  author: z.literal("me"),
  created_at: z.date(),
});

function toInterpretation(raw: unknown): Interpretation {
  const r = interpretationRow.parse(raw);
  return {
    sessionId: r.session_id,
    version: r.version,
    questionSetId: r.question_set,
    answers: r.answers,
    author: r.author,
    createdAt: r.created_at,
  };
}

const UNIQUE_VIOLATION = "23505";
const MAX_ATTEMPTS = 5;

export class PostgresInterpretationRepository implements InterpretationRepository {
  constructor(private readonly sql: Sql) {}

  async appendVersion(input: { sessionId: string; questionSetId: string; answers: Answer[] }): Promise<Interpretation> {
    // 판 번호는 한 문장에서 정한다. 같은 번호가 동시에 들어오면 유일 제약이 막고, 다시 시도한다.
    for (let attempt = 1; ; attempt++) {
      try {
        const [row] = await this.sql`
          insert into interpretation_versions (session_id, version, question_set, answers)
          select ${input.sessionId}, coalesce(max(version), 0) + 1, ${input.questionSetId}, ${this.sql.json(input.answers)}
          from interpretation_versions where session_id = ${input.sessionId}
          returning session_id, version, question_set, answers, author, created_at`;
        return toInterpretation(row);
      } catch (e) {
        const retry = e instanceof postgres.PostgresError && e.code === UNIQUE_VIOLATION && attempt < MAX_ATTEMPTS;
        if (!retry) throw e;
      }
    }
  }

  async latest(sessionId: string): Promise<Interpretation | null> {
    const rows = await this.sql`
      select session_id, version, question_set, answers, author, created_at
      from interpretation_versions where session_id = ${sessionId}
      order by version desc limit 1`;
    return rows.length ? toInterpretation(rows[0]) : null;
  }

  async listVersions(sessionId: string): Promise<Interpretation[]> {
    const rows = await this.sql`
      select session_id, version, question_set, answers, author, created_at
      from interpretation_versions where session_id = ${sessionId}
      order by version`;
    return rows.map(toInterpretation);
  }
}
