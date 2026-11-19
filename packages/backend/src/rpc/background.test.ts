import { createRouterClient, type RouterClient } from "@orpc/server";
import { backgroundTopicSchema } from "@inkle/contract/background";
import { beforeEach, describe, expect, it } from "vitest";
import { BACKGROUND_TOPICS } from "../domain/collection";
import type { RpcContext } from "./context";
import { router } from "./router";
import { testRpcContext } from "../testing/rpc";

const OTHER = "00000000-0000-4000-8000-000000000002";
const ANSWER = "결말은 결국 죽음을 택한 것이고 패배다. 작가는 사회를 고발하려고 썼다고 생각한다.";

let context: RpcContext;
let client: RouterClient<typeof router>;
let bookId: string;

beforeEach(async () => {
  context = testRpcContext();
  client = createRouterClient(router, { context });
  bookId = (await client.books.register({ title: "채식주의자", author: "한강" })).id;
});

async function openSession(save = true) {
  const { id } = await client.sessions.start({ bookId });
  if (save) await client.sessions.saveInterpretation({ sessionId: id, answers: [{ questionId: "about", text: ANSWER }] });
  return id;
}

/** 모임 시작이 넣은 수집을 끝낸다. 배경 셋: 연결될 것, 그냥 보여 줄 것, 대조에 실패해 보여 주지 않을 것 */
async function finishCollection() {
  const c = (await context.collections.latestForBook(bookId))!;
  await context.collections.markRunning(c.id);
  const source = await context.collections.addSource({
    collectionId: c.id,
    bookId,
    url: "https://example.com/a",
    finalUrl: "https://example.com/a?final",
    who: "작가 본인, 인터뷰",
    role: "background",
    fetchStatus: "ok",
    fetchError: null,
    pageText: "-",
    articleText: "-",
    readError: null,
  });
  const base = { collectionId: c.id, bookId, sourceId: source.id, model: "m", promptVersion: "read.v1" };
  const intent = await context.collections.addBackgroundItem({
    ...base,
    topic: "author_intent",
    claimKo: "작가는 질문으로 읽어 달라고 했다.",
    quotes: [
      { text: "I wanted to deal with my long-lasting questions", lang: "en", translationKo: "오랜 물음을 다루고 싶었다", sourceKind: "direct", verified: true },
      { text: "대조에 실패한 인용", lang: "ko", translationKo: null, sourceKind: "direct", verified: false },
    ],
  });
  const era = await context.collections.addBackgroundItem({
    ...base,
    topic: "era",
    claimKo: "1990년대 한국 사회.",
    quotes: [{ text: "사회가 매우 빠르게 변했다", lang: "ko", translationKo: null, sourceKind: "editorial", verified: true }],
  });
  await context.collections.addBackgroundItem({
    ...base,
    topic: "other",
    claimKo: "보여 주지 않을 배경.",
    quotes: [{ text: "없는 문장", lang: "ko", translationKo: null, sourceKind: "editorial", verified: false }],
  });
  await context.collections.markDone(c.id, { models: [], promptVersions: {}, costUsd: 0, candidateCount: 1 });
  return { collectionId: c.id, intent: intent.id, era: era.id };
}

describe("background — 문(門)", () => {
  it("내 해석을 저장하기 전에는 LOCKED 이고 상태도 내주지 않는다", async () => {
    const id = await openSession(false);
    await expect(client.background.get({ sessionId: id })).rejects.toMatchObject({ code: "LOCKED", status: 403 });
    await expect(client.background.recollect({ sessionId: id })).rejects.toMatchObject({ code: "LOCKED", status: 403 });
  });

  it("다른 사용자의 모임이나 없는 모임은 NOT_FOUND", async () => {
    const theirs = await context.sessions.create({ userId: OTHER, bookId });
    await context.interpretations.appendVersion({ sessionId: theirs.id, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: ANSWER }] });
    await expect(client.background.get({ sessionId: theirs.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(client.background.recollect({ sessionId: theirs.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(client.background.get({ sessionId: "abc" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("background.get", () => {
  it("수집 중이면 상태만, 배경은 비어 있다", async () => {
    const id = await openSession();
    const view = await client.background.get({ sessionId: id });
    expect(Object.keys(view).sort()).toEqual(["collection", "connected", "connections", "others"]);
    expect(view).toEqual({ collection: "collecting", connections: "waiting", connected: [], others: [] });
  });

  it("수집이 끝나고 연결 전이면 보여 줄 배경을 주제별로, 대조를 통과한 인용만, 글쓴이와 함께", async () => {
    const id = await openSession();
    const { intent, era } = await finishCollection();
    const view = await client.background.get({ sessionId: id });
    expect(view.collection).toBe("done");
    expect(view.connections).toBe("waiting");
    expect(view.connected).toEqual([]);
    expect(view.others.map((g) => [g.topic, g.items.map((i) => i.id)])).toEqual([
      ["era", [era]],
      ["author_intent", [intent]],
    ]);
    expect(view.others[1].items[0]).toEqual({
      id: intent,
      topic: "author_intent",
      claim: "작가는 질문으로 읽어 달라고 했다.",
      claimAuthor: "ai",
      source: { url: "https://example.com/a?final", who: "작가 본인, 인터뷰" },
      quotes: [
        {
          text: "I wanted to deal with my long-lasting questions",
          author: "external",
          lang: "en",
          translationKo: "오랜 물음을 다루고 싶었다",
          translationAuthor: "ai",
          sourceKind: "direct",
        },
      ],
    });
    expect(view.others[0].items[0].quotes[0]).toMatchObject({ translationKo: null, translationAuthor: null });
  });

  it("최근 판의 연결이 끝나면 맞닿는 배경을 위로, 대조에 실패한 연결은 빼고", async () => {
    const id = await openSession();
    const { collectionId, intent, era } = await finishCollection();
    const run = await context.connections.createRun({ sessionId: id, interpretationVersion: 1, collectionId, promptVersion: "connect.v1" });
    await context.connections.addConnections(run.id, id, [
      { backgroundItemId: intent, myQuote: "작가는 사회를 고발하려고 썼다", noteKo: "작가는 질문으로 읽어 달라고 했다.", questionId: "about", verified: true },
      { backgroundItemId: era, myQuote: "고쳐 옮긴 구절", noteKo: "-", questionId: null, verified: false },
    ]);
    expect((await client.background.get({ sessionId: id })).connections).toBe("making");
    await context.connections.markRunRunning(run.id);
    await context.connections.markRunDone(run.id, { model: "m", costUsd: 0 });

    const view = await client.background.get({ sessionId: id });
    expect(view.connections).toBe("done");
    expect(view.connected).toEqual([
      {
        item: expect.objectContaining({ id: intent }),
        connection: { myQuote: "작가는 사회를 고발하려고 썼다", myQuoteAuthor: "me", questionId: "about", note: "작가는 질문으로 읽어 달라고 했다.", noteAuthor: "ai" },
      },
    ]);
    expect(view.others.flatMap((g) => g.items.map((i) => i.id))).toEqual([era]);
  });

  it("새 판을 저장하면 그 판의 연결을 기다리고, 이전 판의 연결은 보여 주지 않는다", async () => {
    const id = await openSession();
    const { collectionId, intent } = await finishCollection();
    const run = await context.connections.createRun({ sessionId: id, interpretationVersion: 1, collectionId, promptVersion: "connect.v1" });
    await context.connections.addConnections(run.id, id, [
      { backgroundItemId: intent, myQuote: "작가는 사회를 고발하려고 썼다", noteKo: "-", questionId: "about", verified: true },
    ]);
    await context.connections.markRunDone(run.id, { model: "m", costUsd: 0 });
    await client.sessions.saveInterpretation({ sessionId: id, answers: [{ questionId: "about", text: "고쳐 쓴 해석입니다" }] });
    const view = await client.background.get({ sessionId: id });
    // 저장이 새 판의 연결 만들기를 넣었다
    expect(view.connections).toBe("making");
    expect(view.connected).toEqual([]);
  });

  it("연결 만들기가 실패하면 failed, 배경은 그대로 보여 준다", async () => {
    const id = await openSession();
    const { collectionId } = await finishCollection();
    const run = await context.connections.createRun({ sessionId: id, interpretationVersion: 1, collectionId, promptVersion: "connect.v1" });
    await context.connections.markRunFailed(run.id, "실패", { model: null, costUsd: 0 });
    const view = await client.background.get({ sessionId: id });
    expect(view).toMatchObject({ collection: "done", connections: "failed" });
    expect(view.others.length).toBeGreaterThan(0);
  });
});

describe("background.recollect", () => {
  it("수집이 실패했으면 다시 넣고 collecting, 모으는 중이거나 끝났으면 그대로", async () => {
    const id = await openSession();
    const first = (await context.collections.latestForBook(bookId))!;
    expect(await client.background.recollect({ sessionId: id })).toEqual({ collection: "collecting" });
    expect((await context.collections.latestForBook(bookId))!.id).toBe(first.id);

    await context.collections.markRunning(first.id);
    await context.collections.markFailed(first.id, "실패", { models: [], promptVersions: {}, costUsd: 0, candidateCount: 0 });
    expect((await client.background.get({ sessionId: id })).collection).toBe("failed");
    expect(await client.background.recollect({ sessionId: id })).toEqual({ collection: "collecting" });
    const second = (await context.collections.latestForBook(bookId))!;
    expect(second.id).not.toBe(first.id);

    await finishCollection();
    expect(await client.background.recollect({ sessionId: id })).toEqual({ collection: "done" });
    expect((await context.collections.latestForBook(bookId))!.id).toBe(second.id);
  });
});

describe("계약과 도메인", () => {
  it("배경 주제 값이 도메인과 같다", () => {
    expect(backgroundTopicSchema.options).toEqual([...BACKGROUND_TOPICS]);
  });

});
