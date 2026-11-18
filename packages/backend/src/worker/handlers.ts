import { COLLECT_BOOK_JOB, collectBook, collectBookPayload, type CollectDeps } from "../application/collection";
import type { JobHandlers } from "../application/jobs";

// 작업 종류별 처리기. 작업 프로세스(apps/worker)가 조립한 것을 받아 만든다.
export function createHandlers(collect: CollectDeps): JobHandlers {
  return {
    // 시험용. 아무 일도 하지 않는다. 대기열과 작업 프로세스가 동작하는지 확인할 때 쓴다.
    noop: async () => {},

    // 책 한 권의 자료 수집 (ADR-004). 수집이 실패하면 던져서 작업도 실패로 남긴다.
    [COLLECT_BOOK_JOB]: async (job) => {
      const { collectionId } = collectBookPayload.parse(job.payload);
      const r = await collectBook(collect, collectionId);
      if (r.status === "failed") throw new Error(r.error);
    },
  };
}
