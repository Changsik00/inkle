import { describe, expect, it } from "vitest";
import { canSeeOthers, sessionStage } from "./session";

describe("모임의 단계와 문", () => {
  it("저장한 해석이 없으면 writing, 있으면 interpretation_saved", () => {
    expect(sessionStage({ latestInterpretationVersion: null })).toBe("writing");
    expect(sessionStage({ latestInterpretationVersion: 1 })).toBe("interpretation_saved");
  });

  it("다른 시선과 비교는 내 해석을 저장한 뒤에만 볼 수 있다", () => {
    expect(canSeeOthers({ latestInterpretationVersion: null })).toBe(false);
    expect(canSeeOthers({ latestInterpretationVersion: 2 })).toBe(true);
  });
});
