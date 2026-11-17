import type { JobHandlers } from "@/backend/application/jobs";

// 작업 종류별 처리기. 이후 spec 이 여기에 처리기를 추가한다 (예: spec-01-06 의 자료 수집).
export const handlers: JobHandlers = {
  // 시험용. 아무 일도 하지 않는다. 대기열과 작업 프로세스가 동작하는지 확인할 때 쓴다.
  noop: async () => {},
};
