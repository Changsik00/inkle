import { describe, expect, it } from "vitest";
import { MAX_CONNECTIONS, arrangeBackground, checkConnections } from "./connection";

const answers = [
  { questionId: "q1", text: "영혜가 고기를 거부하는 것은 가부장적인 집안에 대한 조용한 저항이라고 읽었다." },
  { questionId: "q4", text: "결말은 결국 죽음을 택한 것이고 패배다. 작가는 사회를 고발하려고 썼다고 생각한다." },
];

describe("checkConnections", () => {
  it("내 답에 그대로 있는 구절은 통과하고 그 질문 번호를 남긴다", () => {
    const [c] = checkConnections(
      [{ backgroundItemId: "b1", myQuote: "작가는 사회를 고발하려고 썼다고 생각한다", noteKo: "작가는 질문으로 읽어 달라고 했다." }],
      answers,
      ["b1"],
    );
    expect(c).toEqual({
      backgroundItemId: "b1",
      myQuote: "작가는 사회를 고발하려고 썼다고 생각한다",
      noteKo: "작가는 질문으로 읽어 달라고 했다.",
      questionId: "q4",
      verified: true,
    });
  });

  it("공백과 따옴표 차이는 맞춰 준다", () => {
    const [c] = checkConnections([{ backgroundItemId: "b1", myQuote: "“조용한  저항이라고 읽었다”", noteKo: "-" }], answers, ["b1"]);
    expect(c).toMatchObject({ verified: true, questionId: "q1" });
  });

  it("고쳐 옮긴 구절, 내 답에 없는 구절, 짧은 구절은 실패하고 질문 번호가 없다", () => {
    const checked = checkConnections(
      [
        { backgroundItemId: "b1", myQuote: "영혜가 고기를 거절하는 것은 가부장적인 집안", noteKo: "-" },
        { backgroundItemId: "b2", myQuote: "이 소설은 폭력과 순수에 대한 이야기다", noteKo: "-" },
        { backgroundItemId: "b3", myQuote: "패배다", noteKo: "-" },
      ],
      answers,
      ["b1", "b2", "b3"],
    );
    expect(checked.map((c) => [c.verified, c.questionId])).toEqual([
      [false, null],
      [false, null],
      [false, null],
    ]);
  });

  it("넘겨준 목록에 없는 배경 번호는 버리고, 같은 배경은 처음 것만 남긴다", () => {
    const checked = checkConnections(
      [
        { backgroundItemId: "nope", myQuote: "결말은 결국 죽음을 택한 것이고", noteKo: "-" },
        { backgroundItemId: "b1", myQuote: "결말은 결국 죽음을 택한 것이고", noteKo: "처음" },
        { backgroundItemId: "b1", myQuote: "조용한 저항이라고 읽었다", noteKo: "두 번째" },
      ],
      answers,
      ["b1"],
    );
    expect(checked.map((c) => c.noteKo)).toEqual(["처음"]);
  });

  it(`많아야 ${MAX_CONNECTIONS}개`, () => {
    const ids = Array.from({ length: MAX_CONNECTIONS + 2 }, (_, i) => `b${i}`);
    const checked = checkConnections(
      ids.map((id) => ({ backgroundItemId: id, myQuote: "결말은 결국 죽음을 택한 것이고", noteKo: "-" })),
      answers,
      ids,
    );
    expect(checked).toHaveLength(MAX_CONNECTIONS);
  });
});

describe("arrangeBackground", () => {
  const items = [
    { id: "e1", topic: "era" as const },
    { id: "l1", topic: "author_life" as const },
    { id: "i1", topic: "author_intent" as const },
    { id: "e2", topic: "era" as const },
    { id: "o1", topic: "other" as const },
  ];

  it("대조를 통과한 연결이 있는 배경을 연결 순서대로 위에 두고, 나머지는 주제 순서로 묶는다", () => {
    const arranged = arrangeBackground(items, [
      { backgroundItemId: "i1", verified: true, noteKo: "첫째" },
      { backgroundItemId: "e2", verified: true, noteKo: "둘째" },
      { backgroundItemId: "l1", verified: false, noteKo: "통과 못 함" },
    ]);
    expect(arranged.connected.map((c) => [c.item.id, c.connection.noteKo])).toEqual([
      ["i1", "첫째"],
      ["e2", "둘째"],
    ]);
    expect(arranged.others.map((g) => [g.topic, g.items.map((i) => i.id)])).toEqual([
      ["era", ["e1"]],
      ["author_life", ["l1"]],
      ["other", ["o1"]],
    ]);
  });

  it("보여 줄 배경 목록에 없는 항목의 연결은 무시한다", () => {
    const arranged = arrangeBackground(items, [{ backgroundItemId: "gone", verified: true }]);
    expect(arranged.connected).toEqual([]);
    expect(arranged.others.flatMap((g) => g.items)).toHaveLength(items.length);
  });
});
