// 사용자 (ADR-003). 지금은 마이그레이션이 넣는 로컬 사용자 한 명뿐이다.
export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";

export type User = {
  id: string;
  displayName: string;
  createdAt: Date;
};
