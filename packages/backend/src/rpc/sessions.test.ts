import { createRouterClient, type RouterClient } from "@orpc/server";
import { ANSWER_MAX as CONTRACT_ANSWER_MAX } from "@inkle/contract/sessions";
import { beforeEach, describe, expect, it } from "vitest";
import { ANSWER_MAX } from "../domain/interpretation";
import { LOCAL_USER_ID } from "../domain/user";
import type { RpcContext } from "./context";
import { router } from "./router";
import { testRpcContext } from "../testing/rpc";

let context: RpcContext;
let client: RouterClient<typeof router>;
let bookId: string;

beforeEach(async () => {
  context = testRpcContext();
  client = createRouterClient(router, { context });
  bookId = (await client.books.register({ title: "노인과 바다", author: "헤밍웨이" })).id;
});

describe("sessions", () => {
  it("모임을 시작하면 writing 단계의 모임이 생긴다", async () => {
    const s = await client.sessions.start({ bookId });
    expect(s).toMatchObject({ bookId, stage: "writing" });
    expect(typeof s.createdAt).toBe("string");
  });

  it("없는 책으로는 시작하지 못한다", async () => {
    await expect(client.sessions.start({ bookId: "00000000-0000-4000-8000-0000000000aa" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("모임 조회: 책, 질문 넷, 해석 없음. 다음 단계의 내용은 담지 않는다", async () => {
    const { id } = await client.sessions.start({ bookId });
    const view = await client.sessions.get({ sessionId: id });
    expect(Object.keys(view).sort()).toEqual(["book", "createdAt", "id", "interpretation", "questionSet", "stage"]);
    expect(view).toMatchObject({ stage: "writing", interpretation: null, book: { id: bookId }, questionSet: { id: "fiction-v1" } });
    expect(view.questionSet.questions).toHaveLength(4);
  });

  it("저장하면 판이 늘고 조회에 최근 판과 interpretation_saved 가 보인다", async () => {
    const { id } = await client.sessions.start({ bookId });
    const v1 = await client.sessions.saveInterpretation({ sessionId: id, answers: [{ questionId: "about", text: " 꿈 " }] });
    expect(v1).toMatchObject({ version: 1, author: "me", answers: [{ questionId: "about", text: "꿈" }] });
    await client.sessions.saveInterpretation({ sessionId: id, answers: [{ questionId: "about", text: "꿈과 현실" }] });
    expect(await client.sessions.get({ sessionId: id })).toMatchObject({
      stage: "interpretation_saved",
      interpretation: { version: 2, answers: [{ text: "꿈과 현실" }] },
    });
  });

  it("빈 해석은 INVALID_INTERPRETATION 과 이유", async () => {
    const { id } = await client.sessions.start({ bookId });
    await expect(client.sessions.saveInterpretation({ sessionId: id, answers: [] })).rejects.toMatchObject({
      code: "INVALID_INTERPRETATION",
      status: 400,
      data: { violations: [{ reason: "no_answer" }] },
    });
  });

  it("책별 모임 목록은 최근 순, 단계와 함께", async () => {
    const a = await client.sessions.start({ bookId });
    const b = await client.sessions.start({ bookId });
    await client.sessions.saveInterpretation({ sessionId: a.id, answers: [{ questionId: "about", text: "x" }] });
    expect((await client.sessions.listForBook({ bookId })).sessions.map((s) => [s.id, s.stage])).toEqual([
      [b.id, "writing"],
      [a.id, "interpretation_saved"],
    ]);
  });

  it("다른 사용자의 모임은 조회도 저장도 NOT_FOUND", async () => {
    const other = await context.sessions.create({ userId: "00000000-0000-4000-8000-000000000002", bookId });
    await expect(client.sessions.get({ sessionId: other.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      client.sessions.saveInterpretation({ sessionId: other.id, answers: [{ questionId: "about", text: "x" }] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(LOCAL_USER_ID).not.toBe(other.userId);
  });

  it("계약의 답 길이 제한은 도메인 규칙과 같다", () => {
    expect(CONTRACT_ANSWER_MAX).toBe(ANSWER_MAX);
  });
});
