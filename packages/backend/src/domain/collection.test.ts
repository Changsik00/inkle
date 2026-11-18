import { describe, expect, it } from "vitest";
import {
  MIN_PERSPECTIVES_FOR_PREVALENCE,
  applyPrevalence,
  canTransition,
  isShowable,
} from "./collection";

describe("isShowable", () => {
  it("대조를 통과한 인용이 하나 이상 있어야 보여 줄 수 있다", () => {
    expect(isShowable({ quotes: [{ verified: false }, { verified: true }] })).toBe(true);
    expect(isShowable({ quotes: [{ verified: false }] })).toBe(false);
    expect(isShowable({ quotes: [] })).toBe(false);
  });
});

describe("applyPrevalence", () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

  it(`보여 줄 수 있는 시선이 ${MIN_PERSPECTIVES_FOR_PREVALENCE}개 미만이면 모두 알 수 없음`, () => {
    expect(applyPrevalence(ids(2), { p1: "majority", p2: "rare" })).toEqual({ p1: "unknown", p2: "unknown" });
  });

  it("셋 이상이면 붙인 값을 쓰고, 빠진 것은 알 수 없음", () => {
    expect(applyPrevalence(ids(3), { p1: "majority", p2: "rare" })).toEqual({
      p1: "majority",
      p2: "rare",
      p3: "unknown",
    });
  });

  it("목록에 없는 시선의 값은 버린다", () => {
    expect(applyPrevalence(ids(3), { p1: "some", other: "majority" })).toEqual({
      p1: "some",
      p2: "unknown",
      p3: "unknown",
    });
  });
});

describe("canTransition", () => {
  it("대기 → 진행 중 → 끝남 / 실패", () => {
    expect(canTransition("queued", "running")).toBe(true);
    expect(canTransition("running", "done")).toBe(true);
    expect(canTransition("running", "failed")).toBe(true);
  });

  it("그 밖의 전이는 막는다", () => {
    expect(canTransition("queued", "done")).toBe(false);
    expect(canTransition("done", "running")).toBe(false);
    expect(canTransition("failed", "running")).toBe(false);
  });
});
