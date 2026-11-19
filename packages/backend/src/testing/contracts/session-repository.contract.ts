// SessionRepository 와 InterpretationRepository 의 계약. 메모리 구현과 Postgres 구현 양쪽에 같은 테스트를 돌린다 (ADR-006 §4).
import { beforeEach, describe, expect, it } from "vitest";
import type { InterpretationRepository, SessionRepository } from "../../application/ports";

/** 계약 테스트의 준비물. Postgres 쪽은 외래 키를 위해 실제 사용자와 책을 만들어 둔다. */
export type SessionFixture = {
  sessions: SessionRepository;
  interpretations: InterpretationRepository;
  userId: string;
  otherUserId: string;
  bookId: string;
  otherBookId: string;
};

export function describeSessionRepositoryContract(name: string, create: () => Promise<SessionFixture>) {
  describe(`SessionRepository 계약: ${name}`, () => {
    let f: SessionFixture;

    beforeEach(async () => {
      f = await create();
    });

    it("만든 모임을 그 사용자로 찾는다", async () => {
      const s = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
      expect(s).toMatchObject({ userId: f.userId, bookId: f.bookId });
      expect(s.createdAt).toBeInstanceOf(Date);
      expect(await f.sessions.findForUser(s.id, f.userId)).toEqual(s);
    });

    it("다른 사용자로는 찾지 못한다", async () => {
      const s = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
      expect(await f.sessions.findForUser(s.id, f.otherUserId)).toBeNull();
    });

    it("없는 모임은 null", async () => {
      expect(await f.sessions.findForUser("00000000-0000-4000-8000-0000000000cc", f.userId)).toBeNull();
    });

    it("책별 목록은 그 사용자의 모임만, 최근 순", async () => {
      const first = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
      const second = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
      await f.sessions.create({ userId: f.otherUserId, bookId: f.bookId });
      await f.sessions.create({ userId: f.userId, bookId: f.otherBookId });
      expect((await f.sessions.listForBook(f.bookId, f.userId)).map((s) => s.id)).toEqual([second.id, first.id]);
    });

    it("listByBook 은 사용자와 무관하게 그 책의 모든 모임을 만든 순서로 (작업 프로세스용)", async () => {
      const mine = await f.sessions.create({ userId: f.userId, bookId: f.bookId });
      const theirs = await f.sessions.create({ userId: f.otherUserId, bookId: f.bookId });
      await f.sessions.create({ userId: f.userId, bookId: f.otherBookId });
      expect((await f.sessions.listByBook(f.bookId)).map((s) => s.id)).toEqual([mine.id, theirs.id]);
    });
  });

  describe(`InterpretationRepository 계약: ${name}`, () => {
    let f: SessionFixture;
    let sessionId: string;

    beforeEach(async () => {
      f = await create();
      sessionId = (await f.sessions.create({ userId: f.userId, bookId: f.bookId })).id;
    });

    it("판이 없으면 latest 는 null", async () => {
      expect(await f.interpretations.latest(sessionId)).toBeNull();
    });

    it("덧붙일 때마다 판이 1, 2 로 늘고 latest 는 마지막 판이다", async () => {
      const v1 = await f.interpretations.appendVersion({
        sessionId,
        questionSetId: "fiction-v1",
        answers: [{ questionId: "about", text: "첫 생각" }],
      });
      const v2 = await f.interpretations.appendVersion({
        sessionId,
        questionSetId: "fiction-v1",
        answers: [{ questionId: "about", text: "고친 생각\n\n둘째 문단" }],
      });
      expect([v1.version, v2.version]).toEqual([1, 2]);
      expect(v2).toMatchObject({ sessionId, questionSetId: "fiction-v1", author: "me" });
      expect(v2.createdAt).toBeInstanceOf(Date);
      expect(await f.interpretations.latest(sessionId)).toEqual(v2);
    });

    it("이전 판은 남는다", async () => {
      await f.interpretations.appendVersion({ sessionId, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "1" }] });
      await f.interpretations.appendVersion({ sessionId, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "2" }] });
      expect((await f.interpretations.listVersions(sessionId)).map((v) => [v.version, v.answers[0].text])).toEqual([
        [1, "1"],
        [2, "2"],
      ]);
    });

    it("모임마다 판 번호가 따로 매겨진다", async () => {
      const other = (await f.sessions.create({ userId: f.userId, bookId: f.bookId })).id;
      await f.interpretations.appendVersion({ sessionId, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "a" }] });
      const v = await f.interpretations.appendVersion({ sessionId: other, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "b" }] });
      expect(v.version).toBe(1);
    });
  });
}
