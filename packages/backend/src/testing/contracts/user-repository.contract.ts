// UserRepository 의 계약. 메모리 구현과 Postgres 구현 양쪽에 같은 테스트를 돌린다 (ADR-006 §4).
// create 는 로컬 사용자 한 명이 들어 있는 저장소를 돌려준다.
import { beforeEach, describe, expect, it } from "vitest";
import type { UserRepository } from "../../application/ports";
import { LOCAL_USER_ID } from "../../domain/user";

export function describeUserRepositoryContract(name: string, create: () => Promise<UserRepository>) {
  describe(`UserRepository 계약: ${name}`, () => {
    let users: UserRepository;

    beforeEach(async () => {
      users = await create();
    });

    it("로컬 사용자를 찾는다", async () => {
      const user = await users.findById(LOCAL_USER_ID);
      expect(user?.id).toBe(LOCAL_USER_ID);
      expect(user?.displayName.length).toBeGreaterThan(0);
      expect(user?.createdAt).toBeInstanceOf(Date);
    });

    it("없는 사용자는 null 이다", async () => {
      expect(await users.findById("00000000-0000-4000-8000-0000000000ff")).toBeNull();
    });
  });
}
