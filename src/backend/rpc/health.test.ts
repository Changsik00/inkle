import { createRouterClient } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { testRpcContext } from "@/backend/testing/rpc";
import { router } from "@/backend/rpc/router";

describe("health.check", () => {
  it("DB 에 닿으면 ok", async () => {
    const client = createRouterClient(router, { context: testRpcContext({ dbReachable: true }) });
    expect(await client.health.check()).toEqual({ db: "ok" });
  });

  it("DB 에 닿지 못하면 SERVICE_UNAVAILABLE", async () => {
    const client = createRouterClient(router, { context: testRpcContext({ dbReachable: false }) });
    await expect(client.health.check()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 });
  });
});
