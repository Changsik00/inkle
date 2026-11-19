import { COLLECT_BOOK_JOB, collectBook, collectBookPayload, type CollectDeps } from "../application/collection";
import {
  CONNECT_BACKGROUND_JOB,
  connectBackground,
  connectBackgroundPayload,
  enqueueConnectionsForBook,
  type ConnectDeps,
} from "../application/connections";
import type { JobHandlers } from "../application/jobs";
import type { JobRepository } from "../application/ports";

/** 작업 프로세스가 조립해 넘기는 것. 수집과 연결 만들기가 함께 쓴다. */
export type WorkerDeps = CollectDeps & ConnectDeps & { jobs: JobRepository };

// 작업 종류별 처리기. 작업 프로세스(apps/worker)가 조립한 것을 받아 만든다.
export function createHandlers(deps: WorkerDeps): JobHandlers {
  return {
    // 시험용. 아무 일도 하지 않는다. 대기열과 작업 프로세스가 동작하는지 확인할 때 쓴다.
    noop: async () => {},

    // 책 한 권의 자료 수집 (ADR-004). 수집이 실패하면 던져서 작업도 실패로 남긴다.
    // 끝나면 그 책의 모임들에 연결 만들기를 넣는다: 수집보다 먼저 내 해석을 저장한 모임이 기다리고 있다.
    [COLLECT_BOOK_JOB]: async (job) => {
      const { collectionId } = collectBookPayload.parse(job.payload);
      const r = await collectBook(deps, collectionId);
      if (r.status === "failed") throw new Error(r.error);
      if (r.status !== "done") return;
      const collection = await deps.collections.findById(collectionId);
      if (collection) await enqueueConnectionsForBook(deps, collection.bookId);
    },

    // 모임 하나의 배경과 내 해석 잇기 (ADR-002 연결). 실패하면 작업도 실패로 남긴다.
    [CONNECT_BACKGROUND_JOB]: async (job) => {
      const { runId } = connectBackgroundPayload.parse(job.payload);
      const r = await connectBackground(deps, runId);
      if (r.status === "failed") throw new Error(r.error);
    },
  };
}
