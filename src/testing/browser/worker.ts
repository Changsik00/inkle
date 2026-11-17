import { setupWorker } from "msw/browser";

// 기본 처리기는 없다. 테스트마다 worker.use(...) 로 응답을 정한다.
export const worker = setupWorker();
