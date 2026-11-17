import { describe, expect, it } from "vitest";
import { ANSWER_MAX, validateAnswers } from "./interpretation";
import { FICTION_V1 } from "./question-set";

describe("validateAnswers", () => {
  it("앞뒤 공백을 지우고 빈 답은 버린다. 질문 순서대로 돌려준다", () => {
    const result = validateAnswers(FICTION_V1, [
      { questionId: "why", text: "  결말 때문에  " },
      { questionId: "about", text: "\n 꿈에 대한 이야기 \n" },
      { questionId: "lingering", text: "   " },
    ]);
    expect(result).toEqual({
      ok: true,
      answers: [
        { questionId: "about", text: "꿈에 대한 이야기" },
        { questionId: "why", text: "결말 때문에" },
      ],
    });
  });

  it("문단 사이 줄바꿈은 그대로 둔다", () => {
    const result = validateAnswers(FICTION_V1, [{ questionId: "about", text: "첫 문단\n\n둘째 문단" }]);
    expect(result.ok && result.answers[0].text).toBe("첫 문단\n\n둘째 문단");
  });

  it("하나도 답하지 않으면 거부한다", () => {
    expect(validateAnswers(FICTION_V1, [{ questionId: "about", text: " " }])).toEqual({
      ok: false,
      violations: [{ reason: "no_answer" }],
    });
  });

  it("4,000자를 넘는 답은 거부한다 (이모지도 한 글자)", () => {
    expect(validateAnswers(FICTION_V1, [{ questionId: "about", text: "📚".repeat(ANSWER_MAX) }]).ok).toBe(true);
    expect(validateAnswers(FICTION_V1, [{ questionId: "about", text: "가".repeat(ANSWER_MAX + 1) }])).toEqual({
      ok: false,
      violations: [{ reason: "too_long", questionId: "about", max: ANSWER_MAX }],
    });
  });

  it("묶음에 없는 질문이나 같은 질문 두 번은 거부한다", () => {
    expect(validateAnswers(FICTION_V1, [{ questionId: "nope", text: "x" }])).toEqual({
      ok: false,
      violations: [{ reason: "unknown_question", questionId: "nope" }],
    });
    expect(
      validateAnswers(FICTION_V1, [
        { questionId: "about", text: "a" },
        { questionId: "about", text: "b" },
      ]),
    ).toEqual({ ok: false, violations: [{ reason: "duplicate_question", questionId: "about" }] });
  });
});
