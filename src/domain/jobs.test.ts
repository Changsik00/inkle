import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "@/db/migrate";
import { resetTestDatabase, testSql } from "@/db/testing";
import { claimJob, completeJob, enqueueJob, failJob, getJob, runNextJob } from "@/domain/jobs";

const sql = testSql();

beforeEach(async () => {
  await resetTestDatabase(sql);
  await migrate(sql);
});

afterAll(async () => {
  await sql.end();
});

describe("작업 대기열", () => {
  it("넣은 작업은 대기 상태다", async () => {
    const id = await enqueueJob(sql, "noop", { a: 1 });
    const job = await getJob(sql, id);
    expect(job).toMatchObject({ id, kind: "noop", payload: { a: 1 }, status: "queued" });
  });

  it("가져가면 진행 중, 끝내면 끝남이 된다", async () => {
    const id = await enqueueJob(sql, "noop", {});
    const claimed = await claimJob(sql);
    expect(claimed).toMatchObject({ id, status: "running" });
    expect(claimed?.startedAt).toBeInstanceOf(Date);

    await completeJob(sql, id);
    const job = await getJob(sql, id);
    expect(job).toMatchObject({ status: "done", error: null });
    expect(job?.finishedAt).toBeInstanceOf(Date);
  });

  it("실패를 기록하면 이유가 남는다", async () => {
    const id = await enqueueJob(sql, "noop", {});
    await claimJob(sql);
    await failJob(sql, id, "무언가 잘못됨");
    expect(await getJob(sql, id)).toMatchObject({ status: "failed", error: "무언가 잘못됨" });
  });

  it("먼저 넣은 작업부터 가져간다", async () => {
    const first = await enqueueJob(sql, "noop", {});
    await enqueueJob(sql, "noop", {});
    expect((await claimJob(sql))?.id).toBe(first);
  });

  it("가져갈 작업이 없으면 null 이다", async () => {
    expect(await claimJob(sql)).toBeNull();
  });

  it("동시에 두 번 가져가도 같은 작업을 둘이 잡지 않는다", async () => {
    await enqueueJob(sql, "noop", {});
    const results = await Promise.all([claimJob(sql), claimJob(sql)]);
    expect(results.filter((r) => r !== null)).toHaveLength(1);
  });

  it("작업이 둘이면 동시에 가져갈 때 서로 다른 작업을 잡는다", async () => {
    await enqueueJob(sql, "noop", {});
    await enqueueJob(sql, "noop", {});
    const [a, b] = await Promise.all([claimJob(sql), claimJob(sql)]);
    expect(a && b && a.id !== b.id).toBe(true);
  });
});

describe("runNextJob", () => {
  it("처리기가 끝나면 작업이 끝남이 된다", async () => {
    const seen: unknown[] = [];
    const id = await enqueueJob(sql, "noop", { x: 2 });
    const ran = await runNextJob(sql, { noop: async (job) => void seen.push(job.payload) });
    expect(ran).toBe(id);
    expect(seen).toEqual([{ x: 2 }]);
    expect((await getJob(sql, id))?.status).toBe("done");
  });

  it("처리기가 예외를 던지면 실패와 이유가 남는다", async () => {
    const id = await enqueueJob(sql, "noop", {});
    await runNextJob(sql, {
      noop: async () => {
        throw new Error("처리 중 오류");
      },
    });
    expect(await getJob(sql, id)).toMatchObject({ status: "failed", error: "처리 중 오류" });
  });

  it("등록되지 않은 종류의 작업은 실패로 기록된다", async () => {
    const id = await enqueueJob(sql, "unknown-kind", {});
    await runNextJob(sql, {});
    const job = await getJob(sql, id);
    expect(job?.status).toBe("failed");
    expect(job?.error).toContain("unknown-kind");
  });

  it("가져갈 작업이 없으면 null 을 돌려준다", async () => {
    expect(await runNextJob(sql, {})).toBeNull();
  });
});
