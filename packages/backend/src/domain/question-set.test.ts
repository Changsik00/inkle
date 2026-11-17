import { describe, expect, it } from "vitest";
import { FICTION_V1, questionSetFor, questionSetById } from "./question-set";

describe("질문 묶음", () => {
  it("소설 묶음 fiction-v1 은 질문 넷이 정해진 순서로 있다", () => {
    expect(FICTION_V1.id).toBe("fiction-v1");
    expect(FICTION_V1.questions.map((q) => q.id)).toEqual(["about", "lingering", "difficult", "why"]);
    expect(FICTION_V1.questions[0].text).toBe("이 책은 결국 무엇에 대한 이야기라고 읽었나요?");
  });

  it("장르로 지금 쓰는 묶음을 찾는다", () => {
    expect(questionSetFor("fiction")).toBe(FICTION_V1);
  });

  it("판 번호로 과거 묶음을 찾는다. 없으면 null", () => {
    expect(questionSetById("fiction-v1")).toBe(FICTION_V1);
    expect(questionSetById("fiction-v0")).toBeNull();
  });
});
