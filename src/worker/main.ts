// 작업 프로세스의 진입점 (`pnpm worker`). 호스트에서 실행한다 (ADR-004 §가정의 확인 결과).
import { setTimeout as sleep } from "node:timers/promises";
import { getSql } from "@/db/client";
import { runNextJob } from "@/domain/jobs";
import { handlers } from "@/worker/handlers";

const IDLE_WAIT_MS = 1000;

async function main() {
  const sql = getSql();
  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  console.log(`작업 프로세스 시작. 처리기: ${Object.keys(handlers).join(", ")}`);
  while (!stopping) {
    try {
      const id = await runNextJob(sql, handlers);
      if (id !== null) {
        console.log(`작업 ${id} 처리`);
        continue;
      }
    } catch (e) {
      // DB 가 잠시 내려가도 프로세스는 멈추지 않고 다시 시도한다.
      console.error("대기열 조회 실패:", e instanceof Error ? e.message : e);
    }
    await sleep(IDLE_WAIT_MS);
  }
  await sql.end();
  console.log("작업 프로세스 종료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
