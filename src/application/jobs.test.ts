import { beforeEach, describe, expect, it } from "vitest";
import { enqueueJob, getJob, runNextJob } from "@/application/jobs";
import { InMemoryJobRepository } from "@/testing/in-memory/in-memory-job-repository";

let jobs: InMemoryJobRepository;

beforeEach(() => {
  jobs = new InMemoryJobRepository();
});

describe("runNextJob", () => {
  it("처리기가 끝나면 작업이 끝남이 되고, 처리기는 작업 내용을 받는다", async () => {
    const seen: unknown[] = [];
    const id = await enqueueJob(jobs, "noop", { x: 2 });
    const ran = await runNextJob(jobs, { noop: async (job) => void seen.push(job.payload) });
    expect(ran).toBe(id);
    expect(seen).toEqual([{ x: 2 }]);
    expect((await getJob(jobs, id))?.status).toBe("done");
  });

  it("처리기가 예외를 던지면 실패와 이유가 남는다", async () => {
    const id = await enqueueJob(jobs, "noop", {});
    await runNextJob(jobs, {
      noop: async () => {
        throw new Error("처리 중 오류");
      },
    });
    expect(await getJob(jobs, id)).toMatchObject({ status: "failed", error: "처리 중 오류" });
  });

  it("Error 가 아닌 값을 던져도 이유가 글자로 남는다", async () => {
    const id = await enqueueJob(jobs, "noop", {});
    await runNextJob(jobs, {
      noop: async () => {
        throw "문자열 오류";
      },
    });
    expect((await getJob(jobs, id))?.error).toBe("문자열 오류");
  });

  it("등록되지 않은 종류의 작업은 실패로 기록되고 이유에 종류가 들어간다", async () => {
    const id = await enqueueJob(jobs, "unknown-kind", {});
    await runNextJob(jobs, {});
    const job = await getJob(jobs, id);
    expect(job?.status).toBe("failed");
    expect(job?.error).toContain("unknown-kind");
  });

  it("객체의 기본 속성 이름(toString 등)을 처리기로 착각하지 않는다", async () => {
    const id = await enqueueJob(jobs, "toString", {});
    await runNextJob(jobs, {});
    expect((await getJob(jobs, id))?.status).toBe("failed");
  });

  it("가져갈 작업이 없으면 null 을 돌려준다", async () => {
    expect(await runNextJob(jobs, {})).toBeNull();
  });

  it("한 번에 작업 하나만 처리한다", async () => {
    await enqueueJob(jobs, "noop", {});
    const second = await enqueueJob(jobs, "noop", {});
    await runNextJob(jobs, { noop: async () => {} });
    expect((await getJob(jobs, second))?.status).toBe("queued");
  });
});
