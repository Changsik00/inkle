// ConnectionRepository 의 계약. 메모리 구현과 Postgres 구현 양쪽에 같은 테스트를 돌린다 (ADR-006 §4).
import { beforeEach, describe, expect, it } from "vitest";
import type { ConnectionRepository } from "../../application/ports";
import type { CheckedConnection } from "../../domain/connection";

/**
 * Postgres 쪽은 외래 키를 위해 실제 모임(판 1, 2), 수집 둘, 배경 항목 둘을 만들어 둔다.
 * 판 1, 2 는 sessionId 의 것이다.
 */
export type ConnectionFixture = {
  connections: ConnectionRepository;
  sessionId: string;
  collectionId: string;
  otherCollectionId: string;
  backgroundItemIds: [string, string];
};

export function describeConnectionRepositoryContract(name: string, create: () => Promise<ConnectionFixture>) {
  describe(`ConnectionRepository 계약: ${name}`, () => {
    let f: ConnectionFixture;

    beforeEach(async () => {
      f = await create();
    });

    const run = (over: { version?: number; collectionId?: string } = {}) =>
      f.connections.createRun({
        sessionId: f.sessionId,
        interpretationVersion: over.version ?? 1,
        collectionId: over.collectionId ?? f.collectionId,
        promptVersion: "connect.v1",
      });

    it("만든 연결 만들기는 대기 상태이고 모델 없음, 비용 0", async () => {
      const r = await run();
      expect(r).toMatchObject({
        sessionId: f.sessionId,
        interpretationVersion: 1,
        collectionId: f.collectionId,
        status: "queued",
        error: null,
        model: null,
        promptVersion: "connect.v1",
        costUsd: 0,
        startedAt: null,
        finishedAt: null,
      });
      expect(r.createdAt).toBeInstanceOf(Date);
      expect(await f.connections.findRun(r.id)).toEqual(r);
      expect(await f.connections.findRun("00000000-0000-4000-8000-0000000000cc")).toBeNull();
    });

    it("latestRun 은 그 모임·그 판의 가장 최근 것, 다른 판은 따로", async () => {
      await run();
      const second = await run({ collectionId: f.otherCollectionId });
      expect((await f.connections.latestRun(f.sessionId, 1))?.id).toBe(second.id);
      expect(await f.connections.latestRun(f.sessionId, 2)).toBeNull();
      const v2 = await run({ version: 2 });
      expect((await f.connections.latestRun(f.sessionId, 2))?.id).toBe(v2.id);
    });

    it("진행 중 → 끝남, 진행 중 → 실패 를 시각·모델·비용과 함께 남긴다", async () => {
      const done = await run();
      await f.connections.markRunRunning(done.id);
      expect(await f.connections.findRun(done.id)).toMatchObject({ status: "running", startedAt: expect.any(Date) });
      await f.connections.markRunDone(done.id, { model: "model-a", costUsd: 0.12 });
      expect(await f.connections.findRun(done.id)).toMatchObject({
        status: "done",
        error: null,
        model: "model-a",
        costUsd: 0.12,
        finishedAt: expect.any(Date),
      });

      const failed = await run({ version: 2 });
      await f.connections.markRunRunning(failed.id);
      await f.connections.markRunFailed(failed.id, "연결 실패", { model: null, costUsd: 0.05 });
      expect(await f.connections.findRun(failed.id)).toMatchObject({ status: "failed", error: "연결 실패", model: null, costUsd: 0.05 });
    });

    it("연결은 넣은 순서대로 남고, 대조에 실패한 것도 남는다", async () => {
      const r = await run();
      const [a, b] = f.backgroundItemIds;
      const input: CheckedConnection[] = [
        { backgroundItemId: b, myQuote: "작가는 사회를 고발하려고 썼다", noteKo: "작가는 질문으로 읽어 달라고 했다.", questionId: "q4", verified: true },
        { backgroundItemId: a, myQuote: "고쳐 옮긴 구절", noteKo: "맞닿는 설명", questionId: null, verified: false },
      ];
      const added = await f.connections.addConnections(r.id, f.sessionId, input);
      expect(added.map((c) => [c.backgroundItemId, c.verified, c.questionId])).toEqual([
        [b, true, "q4"],
        [a, false, null],
      ]);
      expect(added[0]).toMatchObject({ runId: r.id, sessionId: f.sessionId, myQuote: input[0].myQuote, noteKo: input[0].noteKo });
      expect(await f.connections.listConnections(r.id)).toEqual(added);
    });

    it("연결은 그 연결 만들기의 것만 돌려준다", async () => {
      const first = await run();
      const second = await run({ version: 2 });
      await f.connections.addConnections(first.id, f.sessionId, [
        { backgroundItemId: f.backgroundItemIds[0], myQuote: "첫째 판의 구절입니다", noteKo: "-", questionId: "q1", verified: true },
      ]);
      expect(await f.connections.listConnections(second.id)).toEqual([]);
      expect(await f.connections.addConnections(second.id, f.sessionId, [])).toEqual([]);
    });
  });
}
