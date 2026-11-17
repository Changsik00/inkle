// 테스트용 UserRepository.
import type { UserRepository } from "../../application/ports";
import { LOCAL_USER_ID, type User } from "../../domain/user";

export function localUser(): User {
  return { id: LOCAL_USER_ID, displayName: "로컬 사용자", createdAt: new Date() };
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users: Map<string, User>;

  constructor(users: User[]) {
    this.users = new Map(users.map((u) => [u.id, u]));
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? structuredClone(user) : null;
  }
}
