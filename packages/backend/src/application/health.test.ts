import { describe, expect, it } from "vitest";
import { checkHealth } from "./health";
import type { HealthProbe } from "./ports";

const probe = (impl: HealthProbe["isDatabaseReachable"]): HealthProbe => ({ isDatabaseReachable: impl });

describe("checkHealth", () => {
  it("DB 에 닿으면 ok", async () => {
    expect(await checkHealth(probe(async () => true))).toEqual({ db: "ok" });
  });

  it("DB 에 닿지 못하면 down", async () => {
    expect(await checkHealth(probe(async () => false))).toEqual({ db: "down" });
  });

  it("확인 중 예외가 나도 던지지 않고 down", async () => {
    const failing = probe(async () => {
      throw new Error("연결 거부");
    });
    expect(await checkHealth(failing)).toEqual({ db: "down" });
  });
});
