// CollectionRepository 의 계약. 메모리 구현과 Postgres 구현 양쪽에 같은 테스트를 돌린다 (ADR-006 §4).
import { beforeEach, describe, expect, it } from "vitest";
import type { CollectionOutcome, CollectionRepository, NewSource } from "../../application/ports";

/** Postgres 쪽은 외래 키를 위해 실제 책을 만들어 둔다. */
export type CollectionFixture = { collections: CollectionRepository; bookId: string; otherBookId: string };

const outcome: CollectionOutcome = {
  models: ["model-a"],
  promptVersions: { find: "find.v1", read: "read.v1" },
  costUsd: 0.42,
  candidateCount: 7,
};

export function sourceInput(collectionId: string, bookId: string, over: Partial<NewSource> = {}): NewSource {
  return {
    collectionId,
    bookId,
    url: "https://example.com/review",
    finalUrl: "https://example.com/review?x=1",
    who: "평론가 김",
    role: "perspective",
    fetchStatus: "ok",
    fetchError: null,
    pageText: "메뉴 본문 글자 댓글",
    articleText: "본문 글자",
    readError: null,
    ...over,
  };
}

export function describeCollectionRepositoryContract(name: string, create: () => Promise<CollectionFixture>) {
  describe(`CollectionRepository 계약: ${name}`, () => {
    let f: CollectionFixture;

    beforeEach(async () => {
      f = await create();
    });

    it("만든 수집은 대기 상태이고 비용 0, 후보 0", async () => {
      const c = await f.collections.create(f.bookId);
      expect(c).toMatchObject({
        bookId: f.bookId,
        status: "queued",
        error: null,
        models: [],
        promptVersions: {},
        costUsd: 0,
        candidateCount: 0,
        startedAt: null,
        finishedAt: null,
      });
      expect(c.createdAt).toBeInstanceOf(Date);
      expect(await f.collections.findById(c.id)).toEqual(c);
    });

    it("없는 수집은 null", async () => {
      expect(await f.collections.findById("00000000-0000-4000-8000-0000000000cc")).toBeNull();
    });

    it("진행 중 → 끝남: 시각과 결과가 남는다", async () => {
      const c = await f.collections.create(f.bookId);
      await f.collections.markRunning(c.id);
      expect((await f.collections.findById(c.id))?.startedAt).toBeInstanceOf(Date);
      await f.collections.markDone(c.id, outcome);
      const done = await f.collections.findById(c.id);
      expect(done).toMatchObject({ status: "done", error: null, ...outcome });
      expect(done?.finishedAt).toBeInstanceOf(Date);
    });

    it("실패: 이유와 그때까지의 결과가 남는다", async () => {
      const c = await f.collections.create(f.bookId);
      await f.collections.markRunning(c.id);
      await f.collections.markFailed(c.id, "찾기 실패", outcome);
      expect(await f.collections.findById(c.id)).toMatchObject({ status: "failed", error: "찾기 실패", costUsd: 0.42 });
    });

    it("책의 최근 수집", async () => {
      expect(await f.collections.latestForBook(f.bookId)).toBeNull();
      await f.collections.create(f.bookId);
      const second = await f.collections.create(f.bookId);
      await f.collections.create(f.otherBookId);
      expect((await f.collections.latestForBook(f.bookId))?.id).toBe(second.id);
    });

    it("출처는 넣은 순서대로, 열지 못한 출처도 남는다", async () => {
      const c = await f.collections.create(f.bookId);
      const a = await f.collections.addSource(sourceInput(c.id, f.bookId));
      const b = await f.collections.addSource(
        sourceInput(c.id, f.bookId, {
          url: "https://example.com/closed",
          finalUrl: null,
          fetchStatus: "unreachable",
          fetchError: "403",
          pageText: null,
          articleText: null,
        }),
      );
      expect(a.fetchedAt).toBeInstanceOf(Date);
      expect(await f.collections.listSources(c.id)).toEqual([a, b]);
      expect(b).toMatchObject({ fetchStatus: "unreachable", fetchError: "403", pageText: null });
    });

    it("배경 항목과 시선은 인용과 함께 넣고 읽는다. 흔한 읽기는 처음에 알 수 없음", async () => {
      const c = await f.collections.create(f.bookId);
      const s = await f.collections.addSource(sourceInput(c.id, f.bookId));
      const provenance = { collectionId: c.id, model: "model-a", promptVersion: "read.v1" };
      const bg = await f.collections.addBackgroundItem({
        ...provenance,
        bookId: f.bookId,
        sourceId: s.id,
        topic: "author_intent",
        claimKo: "작가는 폭력을 거부하는 사람을 쓰고 싶었다",
        quotes: [
          { text: "폭력에 대해 쓰고 싶었다", lang: "ko", translationKo: null, sourceKind: "direct", verified: true },
          { text: "지어낸 문장", lang: "ko", translationKo: null, sourceKind: "editorial", verified: false },
        ],
      });
      const p = await f.collections.addPerspective({
        ...provenance,
        bookId: f.bookId,
        sourceId: s.id,
        who: "평론가 김",
        role: "critic",
        readingKo: "몸의 저항으로 읽는다",
        quotes: [{ text: "The body resists.", lang: "en", translationKo: "몸이 저항한다.", sourceKind: "editorial", verified: true }],
      });
      expect(bg.quotes.map((q) => [q.text, q.verified, q.sourceId])).toEqual([
        ["폭력에 대해 쓰고 싶었다", true, s.id],
        ["지어낸 문장", false, s.id],
      ]);
      expect(p).toMatchObject({ who: "평론가 김", role: "critic", prevalence: "unknown", model: "model-a", promptVersion: "read.v1" });

      await f.collections.setPrevalence(p.id, "majority");
      expect(await f.collections.listBackgroundItems(c.id)).toEqual([bg]);
      expect(await f.collections.listPerspectives(c.id)).toEqual([{ ...p, prevalence: "majority" }]);
    });

    it("다른 수집의 항목은 섞이지 않는다", async () => {
      const c1 = await f.collections.create(f.bookId);
      const c2 = await f.collections.create(f.bookId);
      const s = await f.collections.addSource(sourceInput(c1.id, f.bookId));
      await f.collections.addPerspective({
        collectionId: c1.id,
        model: "m",
        promptVersion: "read.v1",
        bookId: f.bookId,
        sourceId: s.id,
        who: "독자",
        role: "reader",
        readingKo: "요약",
        quotes: [],
      });
      expect(await f.collections.listPerspectives(c2.id)).toEqual([]);
      expect(await f.collections.listSources(c2.id)).toEqual([]);
    });
  });
}
