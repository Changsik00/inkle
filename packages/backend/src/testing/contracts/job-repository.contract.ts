// JobRepository 의 계약. 메모리 구현과 Postgres 구현 양쪽에 같은 테스트를 돌린다 (ADR-006 §4).
import { beforeEach, describe, expect, it } from "vitest";
import type { JobRepository } from "../../application/ports";

export function describeJobRepositoryContract(name: string, create: () => Promise<JobRepository>) {
  describe(`JobRepository 계약: ${name}`, () => {
    let jobs: JobRepository;

    beforeEach(async () => {
      jobs = await create();
    });

    it("넣은 작업은 대기 상태이고 내용이 그대로 남는다", async () => {
      const id = await jobs.enqueue("noop", { a: 1, b: ["x"] });
      const job = await jobs.findById(id);
      expect(job).toMatchObject({ id, kind: "noop", payload: { a: 1, b: ["x"] }, status: "queued", error: null });
      expect(job?.createdAt).toBeInstanceOf(Date);
      expect(job?.startedAt).toBeNull();
      expect(job?.finishedAt).toBeNull();
    });

    it("없는 작업은 null 이다", async () => {
      expect(await jobs.findById(999_999)).toBeNull();
    });

    it("가져가면 진행 중이 되고 시작 시각이 남는다", async () => {
      const id = await jobs.enqueue("noop", {});
      const claimed = await jobs.claimNext();
      expect(claimed).toMatchObject({ id, status: "running" });
      expect(claimed?.startedAt).toBeInstanceOf(Date);
      expect((await jobs.findById(id))?.status).toBe("running");
    });

    it("끝내면 끝남이 되고 끝난 시각이 남는다", async () => {
      const id = await jobs.enqueue("noop", {});
      await jobs.claimNext();
      await jobs.markDone(id);
      const job = await jobs.findById(id);
      expect(job).toMatchObject({ status: "done", error: null });
      expect(job?.finishedAt).toBeInstanceOf(Date);
    });

    it("실패를 기록하면 이유가 남는다", async () => {
      const id = await jobs.enqueue("noop", {});
      await jobs.claimNext();
      await jobs.markFailed(id, "무언가 잘못됨");
      const job = await jobs.findById(id);
      expect(job).toMatchObject({ status: "failed", error: "무언가 잘못됨" });
      expect(job?.finishedAt).toBeInstanceOf(Date);
    });

    it("먼저 넣은 작업부터 가져간다", async () => {
      const first = await jobs.enqueue("noop", {});
      const second = await jobs.enqueue("noop", {});
      expect((await jobs.claimNext())?.id).toBe(first);
      expect((await jobs.claimNext())?.id).toBe(second);
    });

    it("이미 가져간 작업은 다시 가져가지 않는다", async () => {
      await jobs.enqueue("noop", {});
      await jobs.claimNext();
      expect(await jobs.claimNext()).toBeNull();
    });

    it("가져갈 작업이 없으면 null 이다", async () => {
      expect(await jobs.claimNext()).toBeNull();
    });
  });
}
