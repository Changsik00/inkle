import { describe, expect, it } from "vitest";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/shared/product";

// 테스트 실행기와 `@/` 경로 별칭이 동작하는지 확인한다.
describe("product", () => {
  it("제품 이름과 소개 문구가 있다", () => {
    expect(PRODUCT_NAME).toBe("inkle");
    expect(PRODUCT_TAGLINE.length).toBeGreaterThan(0);
  });
});
