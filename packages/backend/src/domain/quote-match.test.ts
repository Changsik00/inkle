import { describe, expect, it } from "vitest";
import { MIN_QUOTE_LENGTH, matchQuote, normalizeForMatch } from "./quote-match";

const page = `
  <기사> 한강은 인터뷰에서 이렇게 말했다.
  “인간의 폭력에 대해, 그리고 그것을 거부하려는
  한 사람의 몸부림에 대해 쓰고 싶었어요…”
  그는 「채식주의자」를 세 편의 연작으로 썼다.
  The old man had taught the boy to fish and the boy loved him.
`;

describe("normalizeForMatch", () => {
  it("공백을 모두 지우고 따옴표 모양과 줄임표를 하나로 맞춘다", () => {
    expect(normalizeForMatch(" “가 나”\n『다』 ‘라’ … ")).toBe('"가나""다"\'라\'...');
  });
});

describe("matchQuote", () => {
  it("공백과 줄바꿈이 달라도 통과한다", () => {
    expect(matchQuote("그것을 거부하려는 한 사람의 몸부림에 대해 쓰고 싶었어요", page)).toEqual({ verified: true });
  });

  it("따옴표 모양과 줄임표 모양이 달라도 통과한다", () => {
    expect(matchQuote('"인간의 폭력에 대해, 그리고 그것을 거부하려는', page).verified).toBe(true);
    expect(matchQuote("몸부림에 대해 쓰고 싶었어요...", page).verified).toBe(true);
    expect(matchQuote("그는 『채식주의자』를 세 편의 연작으로 썼다", page).verified).toBe(true);
  });

  it("인용 전체를 감싼 따옴표는 떼고 찾는다", () => {
    expect(matchQuote("“그는 「채식주의자」를 세 편의 연작으로 썼다”", page).verified).toBe(true);
  });

  it("외국어 인용도 대소문자까지 그대로 찾는다", () => {
    expect(matchQuote("The old man had taught the boy to fish", page).verified).toBe(true);
    expect(matchQuote("the old man had taught the boy to fish", page)).toEqual({ verified: false, reason: "not_found" });
  });

  it("맞춤법을 고쳐 옮긴 문장은 실패한다", () => {
    expect(matchQuote("한 사람의 몸부림에 대하여 쓰고 싶었어요", page)).toEqual({ verified: false, reason: "not_found" });
  });

  it("가운데를 줄여 옮긴 문장은 실패한다", () => {
    expect(matchQuote("인간의 폭력에 대해 … 쓰고 싶었어요", page).verified).toBe(false);
  });

  it("본문에 없는 문장은 실패한다", () => {
    expect(matchQuote("나는 이 소설을 사랑에 대한 이야기로 썼다", page)).toEqual({ verified: false, reason: "not_found" });
  });

  it(`너무 짧은 인용(${MIN_QUOTE_LENGTH}자 미만)은 본문에 있어도 실패한다`, () => {
    expect(matchQuote("한강은 인터뷰", page)).toEqual({ verified: false, reason: "too_short" });
  });

  it("빈 본문에서는 실패한다", () => {
    expect(matchQuote("그것을 거부하려는 한 사람의 몸부림", "")).toEqual({ verified: false, reason: "not_found" });
  });
});
