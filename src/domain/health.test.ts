import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { testDatabaseUrl } from "@/db/testing";
import { checkHealth } from "@/domain/health";

describe("checkHealth", () => {
  const live = postgres(testDatabaseUrl(), { max: 1 });
  // 아무도 듣지 않는 포트. 연결이 바로 거부된다.
  const dead = postgres("postgres://inkle@127.0.0.1:1/inkle", { max: 1, connect_timeout: 2 });

  afterAll(async () => {
    await live.end();
    await dead.end({ timeout: 1 });
  });

  it("DB 에 닿으면 ok 를 돌려준다", async () => {
    expect(await checkHealth(live)).toEqual({ db: "ok" });
  });

  it("DB 에 닿지 못하면 예외를 던지지 않고 down 을 돌려준다", async () => {
    expect(await checkHealth(dead)).toEqual({ db: "down" });
  });
});
