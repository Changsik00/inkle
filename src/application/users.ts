import type { UserRepository } from "@/application/ports";
import { LOCAL_USER_ID, type User } from "@/domain/user";

// "지금 사용자가 누구인가"를 정하는 유일한 곳 (ADR-003 §4). 인증을 붙일 때 여기만 바꾼다.
export async function currentUser(users: UserRepository): Promise<User> {
  const user = await users.findById(LOCAL_USER_ID);
  if (!user) throw new Error("로컬 사용자가 없다. `pnpm db:migrate` 를 실행했는지 확인한다.");
  return user;
}
