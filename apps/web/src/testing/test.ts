// MSW 의 Vitest 브라우저 모드 recipe 대로 test 를 확장한다. 모든 테스트에 worker 가 자동으로 붙는다.
import { test as testBase } from "vitest";
import { worker } from "@/testing/worker";

// MSW 3 은 두 번 start 하면 오류를 낸다. 한 파일 안에서 한 번만 시작한다.
let started: Promise<unknown> | undefined;

export const test = testBase.extend<{ worker: typeof worker }>({
  worker: [
    async ({}, use) => {
      // 처리기가 없는 요청(테스트 실행기의 모듈 요청 등)은 그대로 통과시킨다.
      started ??= worker.start({ quiet: true, onUnhandledFrame: "bypass" });
      await started;
      await use(worker);
      worker.resetHandlers();
    },
    { auto: true },
  ],
});
