// `pnpm db:migrate` 의 진입점. 마이그레이션은 인프라의 일이라 container 를 거치지 않는다.
import { getSql } from "@/infrastructure/db/client";
import { migrate } from "@/infrastructure/db/migrate";

async function main() {
  const sql = getSql();
  try {
    const applied = await migrate(sql);
    console.log(applied.length ? `적용: ${applied.join(", ")}` : "적용할 마이그레이션 없음");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
