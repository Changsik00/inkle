import { createRouterClient, type RouterClient } from "@orpc/server";
import { prevalenceSchema } from "@inkle/contract/perspectives";
import { beforeEach, describe, expect, it } from "vitest";
import { PREVALENCES, type PerspectiveRole, type Prevalence } from "../domain/collection";
import type { RpcContext } from "./context";
import { router } from "./router";
import { testRpcContext } from "../testing/rpc";

const OTHER = "00000000-0000-4000-8000-000000000002";

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
  if (save) await client.sessions.saveInterpretation({ sessionId: id, answers: [{ questionId: "about", text: "몸의 저항으로 읽었다" }] });
  return id;
}

/** 모임 시작이 넣은 수집을 끝낸다. 다른 사람 셋(흔함 섞음, 하나는 대조 실패), 작가 본인 하나, AI 가 만든 해석 하나 */
async function finishCollection(withImagined = true) {
  const c = (await context.collections.latestForBook(bookId))!;
  await context.collections.markRunning(c.id);
  const source = await context.collections.addSource({
    collectionId: c.id,
    bookId,
    url: "https://example.com/review",
    finalUrl: "https://example.com/review?final",
    who: "평론가 김, 문학동네",
    role: "perspective",
    fetchStatus: "ok",
    fetchError: null,
    pageText: "-",
    articleText: "-",
    readError: null,
  });
  const add = async (who: string, role: PerspectiveRole, prevalence: Prevalence, verified = true) => {
    const p = await context.collections.addPerspective({
      collectionId: c.id,
      bookId,
      sourceId: source.id,
      model: "m",
      promptVersion: "read.v1",
      who,
      role,
      readingKo: `${who}의 읽기`,
      quotes: [
        { text: `${who}가 쓴 문장`, lang: "ko", translationKo: null, sourceKind: "direct", verified },
        { text: "대조에 실패한 인용", lang: "ko", translationKo: null, sourceKind: "direct", verified: false },
      ],
    });
    await context.collections.setPrevalence(p.id, prevalence);
    return p;
  };
  await add("독자 하나", "reader", "rare");
  await add("작가", "author", "majority");
  await add("평론가 김", "critic", "majority");
  await add("지어낸 독자", "reader", "majority", false);
  await add("그 밖의 사람", "other", "unknown");
  if (withImagined) {
    await context.collections.addImaginedPerspective({ collectionId: c.id, bookId, readingKo: "AI 가 만든 읽기", model: "m", promptVersion: "imagine.v1" });
  }
  await context.collections.markDone(c.id, { models: ["m"], promptVersions: {}, costUsd: 0, candidateCount: 1 });
}

describe("문(門)", () => {
  it("내 해석 전에는 잠기고 수집 상태도 내주지 않는다", async () => {
    const id = await openSession(false);
    await expect(client.perspectives.get({ sessionId: id })).rejects.toMatchObject({ code: "LOCKED", status: 403 });
  });

  it("다른 사용자의 모임과 없는 모임은 찾을 수 없다", async () => {
    const theirs = await context.sessions.create({ userId: OTHER, bookId });
    await context.interpretations.appendVersion({ sessionId: theirs.id, questionSetId: "fiction-v1", answers: [{ questionId: "about", text: "남의 해석" }] });
    await expect(client.perspectives.get({ sessionId: theirs.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(client.perspectives.get({ sessionId: "00000000-0000-4000-8000-0000000000ff" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(client.perspectives.get({ sessionId: "abc" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("perspectives.get", () => {
  it("수집이 끝나기 전에는 상태만", async () => {
    const id = await openSession();
    expect(await client.perspectives.get({ sessionId: id })).toEqual({ collection: "collecting", others: [], author: [], imagined: [] });
  });

  it("다른 사람은 흔한 순, 작가 본인은 따로 흔함 없이, AI 가 만든 해석은 따로. 대조를 통과한 것만", async () => {
    const id = await openSession();
    await finishCollection();
    const view = await client.perspectives.get({ sessionId: id });

    expect(Object.keys(view)).toEqual(["collection", "others", "author", "imagined"]);
    expect(view.collection).toBe("done");
    expect(view.others.map((p) => [p.who, p.role, p.prevalence])).toEqual([
      ["평론가 김", "critic", "majority"],
      ["독자 하나", "reader", "rare"],
      ["그 밖의 사람", "other", "unknown"],
    ]);
    expect(view.others[0]).toEqual({
      id: expect.any(String),
      who: "평론가 김",
      role: "critic",
      reading: "평론가 김의 읽기",
      readingAuthor: "ai",
      prevalence: "majority",
      source: { url: "https://example.com/review?final", who: "평론가 김, 문학동네" },
      quotes: [{ text: "평론가 김가 쓴 문장", author: "external", lang: "ko", translationKo: null, translationAuthor: null, sourceKind: "direct" }],
    });
    expect(view.author).toHaveLength(1);
    expect(view.author[0]).not.toHaveProperty("prevalence");
    expect(view.author[0]).toMatchObject({ who: "작가", reading: "작가의 읽기", readingAuthor: "ai" });
    expect(view.imagined).toEqual([{ id: expect.any(String), reading: "AI 가 만든 읽기", readingAuthor: "ai" }]);
  });

  it("AI 가 만든 해석이 없으면 빈 목록", async () => {
    const id = await openSession();
    await finishCollection(false);
    expect((await client.perspectives.get({ sessionId: id })).imagined).toEqual([]);
  });

  it("수집이 실패했으면 실패 상태와 빈 목록", async () => {
    const id = await openSession();
    const c = (await context.collections.latestForBook(bookId))!;
    await context.collections.markRunning(c.id);
    await context.collections.markFailed(c.id, "찾기 실패", { models: [], promptVersions: {}, costUsd: 0, candidateCount: 0 });
    expect(await client.perspectives.get({ sessionId: id })).toEqual({ collection: "failed", others: [], author: [], imagined: [] });
  });

  it("계약의 흔함 값은 도메인과 같다", () => {
    expect(prevalenceSchema.options).toEqual([...PREVALENCES]);
  });
});
