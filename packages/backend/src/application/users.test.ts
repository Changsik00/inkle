import { describe, expect, it } from "vitest";
import { currentUser } from "./users";
import { LOCAL_USER_ID } from "../domain/user";
import { InMemoryUserRepository, localUser } from "../testing/in-memory/in-memory-user-repository";

describe("currentUser", () => {
  it("지금 사용자는 로컬 사용자다", async () => {
    const user = await currentUser(new InMemoryUserRepository([localUser()]));
    expect(user.id).toBe(LOCAL_USER_ID);
  });

  it("로컬 사용자가 없으면 마이그레이션을 안내하는 오류를 낸다", async () => {
    await expect(currentUser(new InMemoryUserRepository([]))).rejects.toThrow("db:migrate");
  });
});
