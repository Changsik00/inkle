import { abandonTestCollections } from "./test-book";

// 이번 실행이 넣은 시험용 책의 수집을 닫는다. 작업 프로세스가 가짜 책을 실제로 모으지 않도록.
export default async function globalTeardown() {
  abandonTestCollections();
}
