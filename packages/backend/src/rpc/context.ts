import type { Container } from "../container";

// 계약 구현이 받는 문맥. 실제로는 container 의 저장소이고, 테스트에서는 메모리 저장소다.
export type RpcContext = Omit<Container, "close">;
