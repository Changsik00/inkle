// 작업을 손으로 넣을 때 쓴다: `pnpm job:enqueue noop`
import { enqueueJob } from "@inkle/backend/application/jobs";
import { container } from "@inkle/backend/container";

async function main() {
  const kind = process.argv[2];
  if (!kind) throw new Error("사용법: pnpm job:enqueue <작업 종류>");
  const c = container();
  try {
    console.log(`작업 ${await enqueueJob(c.jobs, kind, {})} 넣음 (${kind})`);
  } finally {
    await c.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
