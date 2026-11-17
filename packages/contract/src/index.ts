// 엔드포인트와 요청·응답·오류의 유일한 원본 (ADR-007 §3).
// 서버(src/server/rpc/)는 이것을 구현하고, 화면(src/http/client/)은 이것으로 부른다.
// React 와 Next.js 를 가져오지 않는다.
import { booksContract } from "./books";
import { healthContract } from "./health";

export const contract = {
  health: healthContract,
  books: booksContract,
};

export type Contract = typeof contract;
