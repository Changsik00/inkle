// 모임: 한 독자가 한 책을 두고 연 한 번의 모임 (ADR-002 독자 단위, ADR-003 사용자 식별자).
export type Session = {
  id: string;
  userId: string;
  bookId: string;
  createdAt: Date;
};

export const SESSION_STAGES = ["writing", "interpretation_saved"] as const;
export type SessionStage = (typeof SESSION_STAGES)[number];

type StageInput = { latestInterpretationVersion: number | null };

/** 단계는 저장된 해석이 있는지로 정해진다. 이후 단계(배경, 시선, 비교)는 다음 spec 에서 더한다. */
export function sessionStage(s: StageInput): SessionStage {
  return s.latestInterpretationVersion === null ? "writing" : "interpretation_saved";
}

/**
 * 먼저 쓰고, 그다음 본다 (docs/goals.md §원칙, phase-01 성공 기준 5).
 * 배경·다른 시선·비교는 내 해석을 저장한 뒤에만 볼 수 있다.
 */
export function canSeeOthers(s: StageInput): boolean {
  return s.latestInterpretationVersion !== null;
}
