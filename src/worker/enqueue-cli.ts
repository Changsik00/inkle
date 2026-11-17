// 작업을 손으로 넣을 때 쓴다: `pnpm job:enqueue noop`
import { getSql } from "@/db/client";
import { enqueueJob } from "@/domain/jobs";

async function main() {
  const kind = process.argv[2];
  if (!kind) throw new Error("사용법: pnpm job:enqueue <작업 종류>");
  const sql = getSql();
  try {
    console.log(`작업 ${await enqueueJob(sql, kind, {})} 넣음 (${kind})`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
