import { describe, expect, it } from "vitest";
import { AUTHOR_MAX, bookKey, cleanText, isBookId, TITLE_MAX, validateBookInput } from "@/domain/book";

describe("cleanText", () => {
  it("앞뒤 공백을 지우고 안쪽의 연속 공백을 하나로 줄인다", () => {
    expect(cleanText("  노인과   바다 \n")).toBe("노인과 바다");
  });
});

describe("bookKey", () => {
  it("공백과 대소문자가 달라도 같은 책이면 같은 키다", () => {
    expect(bookKey(" The Old  Man and the Sea ", "ERNEST hemingway")).toBe(
      bookKey("the old man and the sea", "Ernest Hemingway"),
    );
  });

  it("제목이나 작가가 다르면 키가 다르다", () => {
    expect(bookKey("노인과 바다", "헤밍웨이")).not.toBe(bookKey("노인과 바다", "어니스트 헤밍웨이"));
  });

  it("제목과 작가의 경계가 섞이지 않는다", () => {
    expect(bookKey("a b", "c")).not.toBe(bookKey("a", "b c"));
  });
});

describe("validateBookInput", () => {
  it("다듬은 제목과 작가를 돌려준다", () => {
    expect(validateBookInput({ title: "  채식주의자 ", author: " 한강 " })).toEqual({
      ok: true,
      value: { title: "채식주의자", author: "한강" },
    });
  });

  it("비어 있거나 공백뿐이면 거부한다", () => {
    expect(validateBookInput({ title: "   ", author: "" })).toEqual({
      ok: false,
      violations: [
        { field: "title", reason: "empty" },
        { field: "author", reason: "empty" },
      ],
    });
  });

  it("길이 제한은 다듬은 뒤의 글자 수로 잰다", () => {
    expect(validateBookInput({ title: `  ${"가".repeat(TITLE_MAX)}  `, author: "a" }).ok).toBe(true);
    expect(validateBookInput({ title: "가".repeat(TITLE_MAX + 1), author: "가".repeat(AUTHOR_MAX + 1) })).toEqual({
      ok: false,
      violations: [
        { field: "title", reason: "too_long", max: TITLE_MAX },
        { field: "author", reason: "too_long", max: AUTHOR_MAX },
      ],
    });
  });

  it("이모지처럼 두 글자 단위로 저장되는 문자도 한 글자로 센다", () => {
    expect(validateBookInput({ title: "📚".repeat(TITLE_MAX), author: "a" }).ok).toBe(true);
  });
});

describe("isBookId", () => {
  it("UUID 모양만 책 번호로 본다", () => {
    expect(isBookId("00000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isBookId("1")).toBe(false);
    expect(isBookId("not-a-uuid")).toBe(false);
  });
});
