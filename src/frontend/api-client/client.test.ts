import { describe, expect, it } from "vitest";
import { ApiError } from "@/frontend/api-client/api-error";
import { createApiClient } from "@/frontend/api-client/client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function clientWith(fetchImpl: typeof fetch, timeoutMs = 1000) {
  return createApiClient({ origin: "http://inkle.test", fetch: fetchImpl, timeoutMs });
}

async function errorOf(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof ApiError) return e;
    throw new Error(`ApiError 가 아닌 오류: ${String(e)}`);
  }
  throw new Error("오류가 나지 않았다");
}

describe("HTTP 클라이언트", () => {
  it("계약의 주소로 요청하고 응답을 돌려준다", async () => {
    const seen: string[] = [];
    const client = clientWith(async (input) => {
      seen.push(input instanceof Request ? `${input.method} ${input.url}` : String(input));
      return json({ db: "ok" });
    });
    expect(await client.health.check()).toEqual({ db: "ok" });
    expect(seen).toEqual(["GET http://inkle.test/api/health"]);
  });

  it("계약에 선언한 오류는 코드와 상태를 가진 ApiError 가 된다", async () => {
    const client = clientWith(async () =>
      json({ defined: true, code: "SERVICE_UNAVAILABLE", status: 503, message: "DB 에 닿지 못함" }, 503),
    );
    const error = await errorOf(client.health.check());
    expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 });
  });

  it("네트워크 오류는 NETWORK_ERROR 가 된다", async () => {
    const client = clientWith(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((await errorOf(client.health.check())).code).toBe("NETWORK_ERROR");
  });

  it("시간 제한을 넘기면 TIMEOUT 이 된다", async () => {
    const client = clientWith(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          // 실제 fetch 처럼, 이미 취소된 신호면 바로 거부하고 아니면 취소를 기다린다.
          const signal = _input instanceof Request ? _input.signal : init?.signal;
          if (signal?.aborted) return reject(signal.reason);
          signal?.addEventListener("abort", () => reject(signal.reason));
        }),
      20,
    );
    expect((await errorOf(client.health.check())).code).toBe("TIMEOUT");
  });

  it("응답이 계약의 모양과 다르면 INVALID_RESPONSE 가 된다", async () => {
    const client = clientWith(async () => json({ db: "maybe" }));
    expect((await errorOf(client.health.check())).code).toBe("INVALID_RESPONSE");
  });

  it("호출하는 쪽이 취소하면 ABORTED 가 된다", async () => {
    const controller = new AbortController();
    const client = clientWith(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          // 실제 fetch 처럼, 이미 취소된 신호면 바로 거부하고 아니면 취소를 기다린다.
          const signal = _input instanceof Request ? _input.signal : init?.signal;
          if (signal?.aborted) return reject(signal.reason);
          signal?.addEventListener("abort", () => reject(signal.reason));
        }),
    );
    const pending = client.health.check(undefined, { signal: controller.signal });
    controller.abort();
    expect((await errorOf(pending)).code).toBe("ABORTED");
  });
});
