import { beforeEach, describe, expect, it } from "vitest";
import { registerBook } from "./books";
import {
  getSessionView,
  listSessionsForBook,
  requireUnlocked,
  saveInterpretation,
  startSession,
  type SessionDeps,
} from "./sessions";
import { InMemoryBookRepository } from "../testing/in-memory/in-memory-book-repository";
import { InMemoryInterpretationRepository, InMemorySessionRepository } from "../testing/in-memory/in-memory-session-repository";

const ME = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";

let deps: SessionDeps;
let bookId: string;

beforeEach(async () => {
  deps = {
    books: new InMemoryBookRepository(),
    sessions: new InMemorySessionRepository(),
    interpretations: new InMemoryInterpretationRepository(),
  };
  const r = await registerBook(deps.books, { title: "노인과 바다", author: "헤밍웨이" });
  if (r.status !== "created") throw new Error("책 준비 실패");
  bookId = r.book.id;
});

async function started() {
  const r = await startSession(deps, ME, bookId);
  if (r.status !== "created") throw new Error("모임 시작 실패");
  return r.session;
}

describe("startSession", () => {
  it("책으로 모임을 연다", async () => {
    const r = await startSession(deps, ME, bookId);
    expect(r).toMatchObject({ status: "created", session: { userId: ME, bookId } });
  });

  it("없는 책이나 모양이 틀린 번호는 book_not_found", async () => {
    expect(await startSession(deps, ME, "00000000-0000-4000-8000-0000000000aa")).toEqual({ status: "book_not_found" });
    expect(await startSession(deps, ME, "abc")).toEqual({ status: "book_not_found" });
  });
});

describe("getSessionView", () => {
  it("내 해석 전: 책, 지금 장르의 질문 묶음, 해석 없음, writing", async () => {
    const s = await started();
    const view = await getSessionView(deps, ME, s.id);
    expect(view).toMatchObject({
      session: { id: s.id },
      book: { id: bookId, title: "노인과 바다" },
      questionSet: { id: "fiction-v1" },
      interpretation: null,
      stage: "writing",
    });
  });

  it("내 해석 뒤: 최근 판과 interpretation_saved", async () => {
    const s = await started();
    await saveInterpretation(deps, ME, s.id, [{ questionId: "about", text: "꿈" }]);
    await saveInterpretation(deps, ME, s.id, [{ questionId: "about", text: "꿈과 현실" }]);
    const view = await getSessionView(deps, ME, s.id);
    expect(view).toMatchObject({ stage: "interpretation_saved", interpretation: { version: 2, answers: [{ text: "꿈과 현실" }] } });
  });

  it("다른 사용자의 모임이나 없는 모임은 null", async () => {
    const s = await started();
    expect(await getSessionView(deps, OTHER, s.id)).toBeNull();
    expect(await getSessionView(deps, ME, "nope")).toBeNull();
  });
});

describe("listSessionsForBook", () => {
  it("내 모임만 최근 순, 단계와 함께", async () => {
    const a = await started();
    const b = await started();
    await saveInterpretation(deps, ME, a.id, [{ questionId: "about", text: "x" }]);
    await startSession(deps, OTHER, bookId);
    expect((await listSessionsForBook(deps, ME, bookId)).map((x) => [x.session.id, x.stage])).toEqual([
      [b.id, "writing"],
      [a.id, "interpretation_saved"],
    ]);
  });
});

describe("saveInterpretation", () => {
  it("다듬은 답으로 새 판을 만든다. 글쓴이는 나, 질문 묶음 판이 남는다", async () => {
    const s = await started();
    const r = await saveInterpretation(deps, ME, s.id, [{ questionId: "about", text: "  꿈  " }]);
    expect(r).toMatchObject({
      status: "saved",
      interpretation: { version: 1, author: "me", questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "꿈" }] },
    });
  });

  it("규칙 위반은 이유와 함께 저장하지 않는다", async () => {
    const s = await started();
    expect(await saveInterpretation(deps, ME, s.id, [{ questionId: "about", text: " " }])).toEqual({
      status: "invalid",
      violations: [{ reason: "no_answer" }],
    });
    expect(await deps.interpretations.latest(s.id)).toBeNull();
  });

  it("다른 사용자의 모임에는 저장하지 못한다", async () => {
    const s = await started();
    expect(await saveInterpretation(deps, OTHER, s.id, [{ questionId: "about", text: "x" }])).toEqual({ status: "not_found" });
  });
});

describe("requireUnlocked — 먼저 쓰고, 그다음 본다", () => {
  it("내 해석 전에는 locked, 뒤에는 unlocked", async () => {
    const s = await started();
    expect(await requireUnlocked(deps, ME, s.id)).toEqual({ status: "locked" });
    await saveInterpretation(deps, ME, s.id, [{ questionId: "about", text: "x" }]);
    expect(await requireUnlocked(deps, ME, s.id)).toMatchObject({ status: "unlocked", session: { id: s.id } });
  });

  it("다른 사용자의 모임은 not_found (잠겨 있는지조차 알리지 않는다)", async () => {
    const s = await started();
    expect(await requireUnlocked(deps, OTHER, s.id)).toEqual({ status: "not_found" });
  });
});
