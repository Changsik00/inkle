// 찾기 단계의 지시문 (ADR-004 §2 의 1단계). 웹 검색만 쓴다. 고치면 판을 올려 새 파일로 둔다 (ADR-005).
// v2: v1 의 실제 실행에서 시선이 작가 본인 쪽으로 쏠렸다 (『채식주의자』 16개 중 11개, 독자 1개).
//     종류별 개수를 정하고, 이 책을 직접 다루는 글만 고르게 한다 (docs/experiments/03-collection).
import { z } from "zod";
import type { Book } from "../../domain/book";
import { SOURCE_ROLES } from "../../domain/collection";

export const version = "find.v2";

export const MAX_CANDIDATES = 10;

export const schema = z.object({
  candidates: z.array(
    z.object({
      url: z.string(),
      who: z.string(),
      use: z.enum(SOURCE_ROLES),
      why: z.string(),
    }),
  ),
});

export type Output = z.infer<typeof schema>;

export function render(book: Pick<Book, "title" | "author">): string {
  return `너는 혼자 책을 읽은 독자를 위해 자료를 찾는 조사원이다. 아래 책에 대해 웹을 검색해, 읽어 볼 만한 글의 주소를 찾아라.

책: 『${book.title}』, ${book.author}

찾을 글 (종류마다 개수를 지킨다. 한 종류가 모자라면 그 자리를 다른 종류로 채우지 말고 더 찾아본다):
- 독자의 감상 글 3개 이상: 개인 블로그, 서점 독자 리뷰, 독서 모임 기록처럼 평범한 독자가 쓴 글
- 평론가·기자·연구자의 평론이나 서평 3개 이상. 그 가운데 하나 이상은 흔한 읽기와 다르게 읽거나 비판하는 글
- 작가 인터뷰나 작가가 직접 쓴 글 2개 이하 (작가의 의도, 쓰게 된 배경)
- 시대 배경이나 작가의 삶을 다룬 글 1~2개

규칙:
- 검색 결과에 실제로 나온 주소만 적는다. 주소를 지어내거나 고쳐 쓰지 않는다.
- 로그인이나 유료 구독이 있어야 읽을 수 있는 글은 뺀다.
- 이 책을 직접 다루는 글만 고른다. 작가의 다른 작품이나 글쓰기 일반만 다루는 글은 뺀다.
- 한 사이트에 몰리지 않게 고르고, 한국어 글과 원어 글을 섞는다.
- 같은 글을 두 번 적지 않는다. 많아야 ${MAX_CANDIDATES}개.
- who: 그 글에서 말하는 사람 (예: "작가 본인, 인터뷰", "평론가 ○○○", "독자 블로그", "서점 독자 리뷰").
- use: background(배경), perspective(해석), both(둘 다).
- why: 이 글을 고른 이유 한 줄.`;
}
