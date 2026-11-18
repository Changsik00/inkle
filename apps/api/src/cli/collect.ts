// 책의 자료 수집을 대기열에 넣는다: `pnpm collect <책 번호> [--force]`
// 실제 수집은 작업 프로세스(`pnpm worker`)가 한다. 구독 사용량을 쓴다 (ADR-004 §1).
import { enqueueCollection } from "@inkle/backend/application/collection";
import { container } from "@inkle/backend/container";

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const bookId = args.find((a) => !a.startsWith("--"));
  if (!bookId) throw new Error("사용법: pnpm collect <책 번호> [--force]");
  const c = container();
  try {
    const book = await c.books.findById(bookId).catch(() => null);
    if (!book) throw new Error(`책이 없다: ${bookId}`);
    const r = await enqueueCollection(c, book.id, { force });
    if (r.status === "exists") {
      console.log(`『${book.title}』 수집이 이미 있다 (${r.collection.status}, ${r.collection.id}). 다시 하려면 --force`);
      return;
    }
    console.log(`『${book.title}』 수집 ${r.collectionId} 을 대기열에 넣음 (작업 ${r.jobId}). 작업 프로세스가 처리한다.`);
  } finally {
    await c.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
