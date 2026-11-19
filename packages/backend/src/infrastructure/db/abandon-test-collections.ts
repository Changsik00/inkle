// 흐름 테스트(E2E)가 남긴 수집을 작업 프로세스가 가져가지 않게 실패로 닫는다.
// E2E 는 개발 DB 에 시험용 책을 등록하고 모임을 열어, 그 책의 수집이 대기열에 들어간다.
// 그대로 두면 작업 프로세스가 가짜 책을 실제로 수집해 구독 사용량을 쓴다.
// 대기 중인 것만 닫는다. 이미 진행 중이거나 끝난 것은 건드리지 않는다.
import type { Sql } from "./client";

export const ABANDONED_ERROR = "시험용 책이라 모으지 않음";

/** 이보다 짧은 접두어는 받지 않는다. 실수로 모든 책을 닫지 않도록. */
const MIN_PREFIX = 4;

export async function abandonTestCollections(sql: Sql, titlePrefix: string): Promise<{ collections: number; jobs: number }> {
  if (titlePrefix.trim().length < MIN_PREFIX) throw new Error(`시험용 책 제목의 접두어가 너무 짧다: "${titlePrefix}"`);
  return sql.begin(async (tx) => {
    const closed = await tx<{ id: string }[]>`
      update collections c set status = 'failed', error = ${ABANDONED_ERROR}, finished_at = now()
      from books b
      where b.id = c.book_id and c.status = 'queued' and starts_with(b.title, ${titlePrefix})
      returning c.id`;
    const ids = closed.map((r) => r.id);
    if (ids.length === 0) return { collections: 0, jobs: 0 };
    const jobs = await tx`
      update jobs set status = 'failed', error = ${ABANDONED_ERROR}, finished_at = now()
      where status = 'queued' and kind = 'collect-book' and payload->>'collectionId' in ${tx(ids)}`;
    return { collections: ids.length, jobs: jobs.count };
  });
}
