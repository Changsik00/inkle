import type { InterpretationDto, SessionSummaryDto } from "@inkle/contract/sessions";
import {
  getSessionView,
  listSessionsForBook,
  saveInterpretation,
  startSession,
} from "../application/sessions";
import { currentUser } from "../application/users";
import type { Interpretation } from "../domain/interpretation";
import type { Session, SessionStage } from "../domain/session";
import { os } from "./os";

const summary = (session: Session, stage: SessionStage): SessionSummaryDto => ({
  id: session.id,
  bookId: session.bookId,
  stage,
  createdAt: session.createdAt.toISOString(),
});

const interpretationDto = (i: Interpretation): InterpretationDto => ({
  version: i.version,
  questionSetId: i.questionSetId,
  answers: i.answers,
  author: i.author,
  createdAt: i.createdAt.toISOString(),
});

// 사용자는 요청에서 받지 않고 서버가 정한다 (ADR-003 §4).
export const sessions = {
  start: os.sessions.start.handler(async ({ context, input, errors }) => {
    const user = await currentUser(context.users);
    const r = await startSession(context, user.id, input.bookId);
    if (r.status === "book_not_found") throw errors.NOT_FOUND();
    return summary(r.session, "writing");
  }),

  listForBook: os.sessions.listForBook.handler(async ({ context, input }) => {
    const user = await currentUser(context.users);
    const list = await listSessionsForBook(context, user.id, input.bookId);
    return { sessions: list.map((x) => summary(x.session, x.stage)) };
  }),

  get: os.sessions.get.handler(async ({ context, input, errors }) => {
    const user = await currentUser(context.users);
    const view = await getSessionView(context, user.id, input.sessionId);
    if (!view) throw errors.NOT_FOUND();
    return {
      id: view.session.id,
      stage: view.stage,
      createdAt: view.session.createdAt.toISOString(),
      book: { ...view.book, createdAt: view.book.createdAt.toISOString() },
      questionSet: { id: view.questionSet.id, questions: [...view.questionSet.questions] },
      interpretation: view.interpretation ? interpretationDto(view.interpretation) : null,
    };
  }),

  saveInterpretation: os.sessions.saveInterpretation.handler(async ({ context, input, errors }) => {
    const user = await currentUser(context.users);
    const r = await saveInterpretation(context, user.id, input.sessionId, input.answers);
    if (r.status === "not_found") throw errors.NOT_FOUND();
    if (r.status === "invalid") throw errors.INVALID_INTERPRETATION({ data: { violations: r.violations } });
    return interpretationDto(r.interpretation);
  }),
};
