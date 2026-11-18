// 찾기 단계의 지시문 (ADR-004 §2 의 1단계). 웹 검색만 쓴다. 고치면 판을 올려 새 파일로 둔다 (ADR-005).
import { z } from "zod";
import type { Book } from "../../domain/book";
import { SOURCE_ROLES } from "../../domain/collection";

export const version = "find.v1";

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

찾을 글:
- 작가 인터뷰나 작가가 직접 쓴 글 (작가의 의도, 쓰게 된 배경)
- 평론가·기자의 평론이나 서평 (이 책을 어떻게 읽는가)
- 독자의 감상 글 (이 책을 어떻게 읽는가)
- 시대 배경이나 작가의 삶을 다룬 글

규칙:
- 검색 결과에 실제로 나온 주소만 적는다. 주소를 지어내거나 고쳐 쓰지 않는다.
- 로그인이나 유료 구독이 있어야 읽을 수 있는 글은 뺀다.
- 한 사이트에 몰리지 않게 고르고, 한국어 글과 원어 글을 섞는다.
- 같은 글을 두 번 적지 않는다. 많아야 ${MAX_CANDIDATES}개.
- who: 그 글에서 말하는 사람 (예: "작가 본인, 인터뷰", "평론가 ○○○", "독자 블로그").
- use: background(배경), perspective(해석), both(둘 다).
- why: 이 글을 고른 이유 한 줄.`;
}
