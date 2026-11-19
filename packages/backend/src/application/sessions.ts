// 모임과 내 해석의 유스케이스. 사용자는 호출하는 쪽이 정해 넘긴다 (currentUser, ADR-003 §4).
import { enqueueCollection } from "./collection";
import type { BookRepository, CollectionRepository, InterpretationRepository, JobRepository, SessionRepository } from "./ports";
import { isBookId, type Book } from "../domain/book";
import { isUuid } from "../domain/id";
import { validateAnswers, type Answer, type Interpretation, type InterpretationViolation } from "../domain/interpretation";
import { questionSetById, questionSetFor, type QuestionSet } from "../domain/question-set";
import { canSeeOthers, sessionStage, type Session, type SessionStage } from "../domain/session";

export type SessionDeps = {
  books: BookRepository;
  sessions: SessionRepository;
  interpretations: InterpretationRepository;
  /** 모임을 열면 그 책의 자료 수집을 대기열에 넣는다 (ADR-004 §7) */
  collections: CollectionRepository;
  jobs: JobRepository;
};

export type SessionView = {
  session: Session;
  book: Book;
  /** 저장한 해석이 있으면 그 해석이 답한 묶음, 없으면 이 책의 장르에 지금 쓰는 묶음 */
  questionSet: QuestionSet;
  interpretation: Interpretation | null;
  stage: SessionStage;
};

async function findSession(deps: SessionDeps, userId: string, sessionId: string): Promise<Session | null> {
  return isUuid(sessionId) ? deps.sessions.findForUser(sessionId, userId) : null;
}

export async function startSession(
  deps: SessionDeps,
  userId: string,
  bookId: string,
): Promise<{ status: "created"; session: Session } | { status: "book_not_found" }> {
  const book = isBookId(bookId) ? await deps.books.findById(bookId) : null;
  if (!book) return { status: "book_not_found" };
  const session = await deps.sessions.create({ userId, bookId: book.id });
  // 독자가 내 해석을 쓰는 동안 뒤에서 모은다. 이미 있으면 넣지 않는다.
  await enqueueCollection(deps, book.id);
  return { status: "created", session };
}

export async function getSessionView(deps: SessionDeps, userId: string, sessionId: string): Promise<SessionView | null> {
  const session = await findSession(deps, userId, sessionId);
  if (!session) return null;
  const book = await deps.books.findById(session.bookId);
  if (!book) return null;
  const interpretation = await deps.interpretations.latest(session.id);
  const questionSet =
    (interpretation && questionSetById(interpretation.questionSetId)) || questionSetFor(book.genre);
  return {
    session,
    book,
    questionSet,
    interpretation,
    stage: sessionStage({ latestInterpretationVersion: interpretation?.version ?? null }),
  };
}

export async function listSessionsForBook(
  deps: SessionDeps,
  userId: string,
  bookId: string,
): Promise<{ session: Session; stage: SessionStage }[]> {
  if (!isBookId(bookId)) return [];
  const sessions = await deps.sessions.listForBook(bookId, userId);
  return Promise.all(
    sessions.map(async (session) => {
      const latest = await deps.interpretations.latest(session.id);
      return { session, stage: sessionStage({ latestInterpretationVersion: latest?.version ?? null }) };
    }),
  );
}

export async function saveInterpretation(
  deps: SessionDeps,
  userId: string,
  sessionId: string,
  answers: Answer[],
): Promise<
  | { status: "saved"; interpretation: Interpretation }
  | { status: "invalid"; violations: InterpretationViolation[] }
  | { status: "not_found" }
> {
  const session = await findSession(deps, userId, sessionId);
  if (!session) return { status: "not_found" };
  const book = await deps.books.findById(session.bookId);
  if (!book) return { status: "not_found" };
  // 고쳐 쓸 때도 지금 쓰는 묶음에 답한다. 과거 판은 자기 묶음의 판을 그대로 갖고 있다.
  const set = questionSetFor(book.genre);
  const checked = validateAnswers(set, answers);
  if (!checked.ok) return { status: "invalid", violations: checked.violations };
  const interpretation = await deps.interpretations.appendVersion({
    sessionId: session.id,
    questionSetId: set.id,
    answers: checked.answers,
  });
  return { status: "saved", interpretation };
}

/**
 * 문(門): 배경·다른 시선·비교를 읽기 전에 반드시 거친다 (phase-01 성공 기준 5, ADR-004 §7).
 * 다른 사용자의 모임이면 잠겨 있는지조차 알리지 않고 not_found.
 */
export async function requireUnlocked(
  deps: SessionDeps,
  userId: string,
  sessionId: string,
): Promise<{ status: "unlocked"; session: Session; interpretation: Interpretation } | { status: "locked" } | { status: "not_found" }> {
  const session = await findSession(deps, userId, sessionId);
  if (!session) return { status: "not_found" };
  const interpretation = await deps.interpretations.latest(session.id);
  if (!interpretation || !canSeeOthers({ latestInterpretationVersion: interpretation.version })) {
    return { status: "locked" };
  }
  return { status: "unlocked", session, interpretation };
}
