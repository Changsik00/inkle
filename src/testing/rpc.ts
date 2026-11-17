// 테스트용 RPC 문맥. 메모리 저장소로 채운다.
import type { RpcContext } from "@/server/rpc/context";
import { InMemoryBookRepository } from "@/testing/in-memory/in-memory-book-repository";
import { InMemoryJobRepository } from "@/testing/in-memory/in-memory-job-repository";
import { InMemoryUserRepository, localUser } from "@/testing/in-memory/in-memory-user-repository";

export function testRpcContext(options: { dbReachable?: boolean } = {}): RpcContext {
  return {
    healthProbe: { isDatabaseReachable: async () => options.dbReachable ?? true },
    users: new InMemoryUserRepository([localUser()]),
    jobs: new InMemoryJobRepository(),
    books: new InMemoryBookRepository(),
  };
}
