import { describe, expect, it } from "vitest";
import {
  MIN_PERSPECTIVES_FOR_PREVALENCE,
  MIN_REAL_PERSPECTIVES,
  arrangePerspectives,
  needsImagined,
  prevalenceOf,
  prevalenceTargets,
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

describe("흔함 정도는 작가 본인이 아닌 사람의 읽기에만", () => {
  const p = (id: string, role: "critic" | "author" | "reader" | "other", verified = true) => ({
    id,
    role,
    prevalence: "majority" as const,
    quotes: [{ verified }],
  });

  it("작가 본인의 시선은 저장된 값이 있어도 흔함 정도가 없다", () => {
    expect(prevalenceOf({ role: "author", prevalence: "majority" })).toBeNull();
    expect(prevalenceOf({ role: "critic", prevalence: "rare" })).toBe("rare");
    expect(prevalenceOf({ role: "reader", prevalence: "unknown" })).toBe("unknown");
  });

  it("흔함을 매길 대상은 보여 줄 수 있고 작가 본인이 아닌 시선", () => {
    const list = [p("a", "author"), p("c", "critic"), p("r", "reader", false), p("o", "other")];
    expect(prevalenceTargets(list).map((x) => x.id)).toEqual(["c", "o"]);
  });

  it("작가 본인은 다수 의견을 말할 수 있는 개수에 세지 않는다", () => {
    const list = [p("a1", "author"), p("a2", "author"), p("c", "critic"), p("r", "reader")];
    const ids = prevalenceTargets(list).map((x) => x.id);
    expect(applyPrevalence(ids, { c: "majority", r: "rare" })).toEqual({ c: "unknown", r: "unknown" });
  });
});

describe("needsImagined", () => {
  it(`다른 사람의 시선이 ${MIN_REAL_PERSPECTIVES}개가 되도록 모자란 만큼`, () => {
    expect(needsImagined(0)).toBe(3);
    expect(needsImagined(2)).toBe(1);
    expect(needsImagined(3)).toBe(0);
    expect(needsImagined(5)).toBe(0);
  });
});

describe("arrangePerspectives", () => {
  const p = (id: string, role: "critic" | "author" | "reader" | "other", prevalence: "majority" | "some" | "rare" | "unknown") => ({
    id,
    role,
    prevalence,
  });

  it("다른 사람은 다수 → 일부 → 드문 → 알 수 없음, 같은 값 안에서는 모은 순서. 작가 본인은 따로", () => {
    const arranged = arrangePerspectives([
      p("u1", "reader", "unknown"),
      p("r1", "critic", "rare"),
      p("a1", "author", "majority"),
      p("m1", "reader", "majority"),
      p("s1", "other", "some"),
      p("m2", "critic", "majority"),
      p("a2", "author", "rare"),
    ]);
    expect(arranged.others.map((x) => x.id)).toEqual(["m1", "m2", "s1", "r1", "u1"]);
    expect(arranged.author.map((x) => x.id)).toEqual(["a1", "a2"]);
  });
});
