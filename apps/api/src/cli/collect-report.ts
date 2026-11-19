// 책의 최근 수집을 글로 보여 준다: `pnpm collect:report <책 번호> [--quotes]`
// 출처마다 가져오기·읽기 결과, 항목마다 인용과 대조 결과, 비용과 걸린 시간.
import { collectionReport } from "@inkle/backend/application/collection";
import { container } from "@inkle/backend/container";

const mark = (verified: boolean) => (verified ? "✓" : "✗");
const short = (s: string, n = 120) => (s.length > n ? `${s.slice(0, n)}…` : s);

async function main() {
  const args = process.argv.slice(2);
  const bookId = args.find((a) => !a.startsWith("--"));
  const showQuotes = args.includes("--quotes");
  if (!bookId) throw new Error("사용법: pnpm collect:report <책 번호> [--quotes]");
  const c = container();
  try {
    const r = await collectionReport(c, bookId);
    if (!r) throw new Error("책이나 수집이 없다");
    const { collection: col, counts: n } = r;
    const seconds =
      col.startedAt && col.finishedAt ? ((col.finishedAt.getTime() - col.startedAt.getTime()) / 1000).toFixed(0) : "-";

    console.log(`『${r.book.title}』 ${r.book.author}`);
    console.log(`수집 ${col.id}  상태 ${col.status}${col.error ? ` (${col.error})` : ""}`);
    console.log(`걸린 시간 ${seconds}초  비용 추정치 ${col.costUsd.toFixed(2)}달러  모델 ${col.models.join(", ") || "-"}`);
    console.log(`지시문 ${Object.values(col.promptVersions).join(", ") || "-"}`);
    console.log("");
    console.log(`후보 ${n.candidates}  열린 출처 ${n.sourcesOk}  열지 못함 ${n.sourcesUnreachable}  읽기 실패 ${n.readFailures}`);
    console.log(`인용 대조 ${n.verifiedQuotes}/${n.quotes}${n.quotes ? ` (${Math.round((n.verifiedQuotes / n.quotes) * 100)}%)` : ""}`);
    console.log(`보여 줄 수 있는 배경 ${n.showableBackground}/${n.background}  시선 ${n.showablePerspectives}/${n.perspectives}  AI 가 만든 해석 ${n.imagined}`);

    for (const s of r.sources) {
      console.log("");
      const state = s.fetchStatus === "ok" ? (s.readError ? `읽기 실패: ${s.readError}` : `본문 ${s.articleText?.length ?? 0}자`) : `열지 못함: ${s.fetchError}`;
      console.log(`■ ${s.url}`);
      console.log(`  ${s.who} · ${s.role} · ${state}`);
      for (const b of r.background.filter((x) => x.sourceId === s.id)) {
        console.log(`  [배경 ${b.topic}] ${short(b.claimKo)}  인용 ${b.quotes.map((q) => mark(q.verified)).join("")}`);
        if (showQuotes) for (const q of b.quotes) console.log(`    ${mark(q.verified)} (${q.lang}, ${q.sourceKind}) ${short(q.text, 200)}`);
      }
      for (const p of r.perspectives.filter((x) => x.sourceId === s.id)) {
        console.log(`  [시선 ${p.role} · ${p.prevalence}] ${p.who}: ${short(p.readingKo)}  인용 ${p.quotes.map((q) => mark(q.verified)).join("")}`);
        if (showQuotes) for (const q of p.quotes) console.log(`    ${mark(q.verified)} (${q.lang}, ${q.sourceKind}) ${short(q.text, 200)}`);
      }
    }
    if (r.imagined.length) {
      console.log("");
      console.log(`■ AI 가 만든 해석 ${r.imagined.length}개 (출처 없음)`);
      for (const p of r.imagined) console.log(`  ${short(p.readingKo)}`);
    }
  } finally {
    await c.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
