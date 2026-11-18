import { describe, expect, it } from "vitest";
import {
  MIN_PERSPECTIVES_FOR_PREVALENCE,
  STALE_AFTER_MS,
  applyPrevalence,
  blocksNewCollection,
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

describe("blocksNewCollection", () => {
  const now = new Date("2026-11-18T10:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it("끝난 수집은 막고 실패한 수집은 막지 않는다", () => {
    expect(blocksNewCollection({ status: "done", createdAt: ago(STALE_AFTER_MS * 10), startedAt: null }, now)).toBe(true);
    expect(blocksNewCollection({ status: "failed", createdAt: ago(1000), startedAt: null }, now)).toBe(false);
  });

  it("대기·진행 중은 멈춘 지 오래되지 않았을 때만 막는다", () => {
    expect(blocksNewCollection({ status: "queued", createdAt: ago(1000), startedAt: null }, now)).toBe(true);
    expect(blocksNewCollection({ status: "queued", createdAt: ago(STALE_AFTER_MS + 1), startedAt: null }, now)).toBe(false);
    expect(blocksNewCollection({ status: "running", createdAt: ago(STALE_AFTER_MS * 2), startedAt: ago(1000) }, now)).toBe(true);
    expect(blocksNewCollection({ status: "running", createdAt: ago(STALE_AFTER_MS * 2), startedAt: ago(STALE_AFTER_MS + 1) }, now)).toBe(false);
  });
});
