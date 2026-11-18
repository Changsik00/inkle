import { beforeEach, describe, expect, it } from "vitest";
import { registerBook } from "./books";
import {
  COLLECT_BOOK_JOB,
  collectBook,
  collectionReport,
  enqueueCollection,
  MAX_SOURCES,
  type CollectDeps,
} from "./collection";
import type { LlmCall } from "./ports";
import { STALE_AFTER_MS } from "../domain/collection";
import * as find from "./prompts/find.v1";
import * as read from "./prompts/read.v1";
import { FakeLlm, type FakeResponder } from "../testing/fakes/llm";
import { FakePageFetcher } from "../testing/fakes/page-fetcher";
import { InMemoryBookRepository } from "../testing/in-memory/in-memory-book-repository";
import { InMemoryCollectionRepository } from "../testing/in-memory/in-memory-collection-repository";
import { InMemoryJobRepository } from "../testing/in-memory/in-memory-job-repository";

const A = "https://a.example.com/interview";
const B = "https://b.example.com/closed";
const C = "https://c.example.com/review";

const ARTICLE_A = "작가는 이렇게 말했다. 인간의 폭력에 대해 쓰고 싶었습니다. 그것이 시작이었다고 했다.";
const ARTICLE_C = "평론가는 이 소설을 몸의 저항에 관한 이야기로 읽었다. 주인공의 침묵은 거부의 언어다.";

type ReadOutput = read.Output;
type Quote = ReadOutput["background"][number]["quotes"][number];

const q = (text: string, over: Partial<Quote> = {}): Quote => ({
  text,
  lang: "ko",
  translation_ko: "",
  source_kind: "editorial",
  ...over,
});

const candidates = (...urls: string[]): find.Output => ({
  candidates: urls.map((url) => ({ url, who: `글쓴이 ${url}`, use: "both", why: "이유" })),
});

const readA: ReadOutput = {
  background: [
    {
      topic: "author_intent",
      claim_ko: "작가는 폭력을 쓰고 싶었다",
      quotes: [q("인간의 폭력에 대해 쓰고 싶었습니다.", { source_kind: "direct" })],
    },
  ],
  perspectives: [
    { who: "기자", role: "critic", reading_ko: "지어낸 요약", quotes: [q("이 문장은 본문 어디에도 없습니다")] },
  ],
};

const readC: ReadOutput = {
  background: [],
  perspectives: [
    {
      who: "평론가 김",
      role: "critic",
      reading_ko: "몸의 저항으로 읽는다",
      quotes: [q("이 소설을 몸의 저항에 관한 이야기로 읽었다")],
    },
  ],
};

/** 지시문에 담긴 주소로 어느 출처의 읽기인지 고른다. */
function responder(opts: { find?: unknown[]; reads?: Record<string, unknown[]>; prevalence?: unknown[] }): FakeResponder {
  const queues = {
    find: [...(opts.find ?? [candidates(A, B, C)])],
    prevalence: [...(opts.prevalence ?? [{ labels: [] }])],
    reads: Object.fromEntries(Object.entries(opts.reads ?? { [A]: [readA], [C]: [readC] }).map(([k, v]) => [k, [...v]])),
  };
  const next = (queue: unknown[] | undefined) => (queue && queue.length > 1 ? queue.shift() : queue?.[0]);
  return (call: LlmCall) => {
    const stage = FakeLlm.stageOf(call);
    if (stage === "find") return next(queues.find);
    if (stage === "prevalence") return next(queues.prevalence);
    const url = Object.keys(queues.reads).find((u) => call.prompt.includes(`글의 주소: ${u}`));
    return url ? next(queues.reads[url]) : { background: [], perspectives: [] };
  };
}

let books: InMemoryBookRepository;
let collections: InMemoryCollectionRepository;
let jobs: InMemoryJobRepository;
let bookId: string;

beforeEach(async () => {
  books = new InMemoryBookRepository();
  collections = new InMemoryCollectionRepository();
  jobs = new InMemoryJobRepository();
  const r = await registerBook(books, { title: "채식주의자", author: "한강" });
  if (r.status !== "created") throw new Error("책 준비 실패");
  bookId = r.book.id;
});

function deps(llm: FakeLlm, pages = new FakePageFetcher({ [A]: FakePageFetcher.page(ARTICLE_A), [C]: FakePageFetcher.page(ARTICLE_C) })): CollectDeps & { llm: FakeLlm; pages: FakePageFetcher } {
  return { books, collections, llm, pages };
}

async function queued() {
  return (await collections.create(bookId)).id;
}

describe("enqueueCollection", () => {
  it("처음이면 수집을 만들고 collect-book 작업을 넣는다", async () => {
    const r = await enqueueCollection({ collections, jobs }, bookId);
    expect(r.status).toBe("queued");
    if (r.status !== "queued") return;
    expect(await jobs.findById(r.jobId)).toMatchObject({ kind: COLLECT_BOOK_JOB, payload: { collectionId: r.collectionId } });
    expect(await collections.findById(r.collectionId)).toMatchObject({ bookId, status: "queued" });
  });

  it("대기·진행 중·끝난 수집이 있으면 넣지 않는다", async () => {
    const first = await enqueueCollection({ collections, jobs }, bookId);
    expect((await enqueueCollection({ collections, jobs }, bookId)).status).toBe("exists");
    if (first.status !== "queued") return;
    await collections.markRunning(first.collectionId);
    expect((await enqueueCollection({ collections, jobs }, bookId)).status).toBe("exists");
    await collections.markDone(first.collectionId, { models: [], promptVersions: {}, costUsd: 0, candidateCount: 0 });
    expect((await enqueueCollection({ collections, jobs }, bookId)).status).toBe("exists");
    expect(await jobs.claimNext()).not.toBeNull();
    expect(await jobs.claimNext()).toBeNull();
  });

  it("오래 멈춘 대기 수집은 막지 않는다 (작업 프로세스가 버린 경우)", async () => {
    await enqueueCollection({ collections, jobs }, bookId);
    const later = new Date(Date.now() + STALE_AFTER_MS + 1000);
    expect((await enqueueCollection({ collections, jobs }, bookId, { now: later })).status).toBe("queued");
  });

  it("실패한 수집만 있으면 다시 넣는다. force 면 끝난 수집이 있어도 넣는다", async () => {
    const first = await enqueueCollection({ collections, jobs }, bookId);
    if (first.status !== "queued") return;
    await collections.markRunning(first.collectionId);
    await collections.markFailed(first.collectionId, "x", { models: [], promptVersions: {}, costUsd: 0, candidateCount: 0 });
    const again = await enqueueCollection({ collections, jobs }, bookId);
    expect(again.status).toBe("queued");
    expect((await enqueueCollection({ collections, jobs }, bookId, { force: true })).status).toBe("queued");
  });
});

describe("collectBook", () => {
  it("찾기 → 가져오기 → 읽기 → 대조: 출처와 항목을 남기고 수집을 끝낸다", async () => {
    const d = deps(new FakeLlm(responder({}), { costUsd: 0.25, model: "model-x" }));
    const id = await queued();

    expect(await collectBook(d, id)).toMatchObject({ status: "done" });

    const sources = await collections.listSources(id);
    expect(sources.map((s) => [s.url, s.fetchStatus])).toEqual([
      [A, "ok"],
      [B, "unreachable"],
      [C, "ok"],
    ]);
    expect(sources[1]).toMatchObject({ fetchError: "HTTP 404", pageText: null, who: `글쓴이 ${B}` });

    const [bg] = await collections.listBackgroundItems(id);
    expect(bg).toMatchObject({
      topic: "author_intent",
      claimKo: "작가는 폭력을 쓰고 싶었다",
      collectionId: id,
      model: "model-x",
      promptVersion: "read.v1",
      sourceId: sources[0].id,
    });
    expect(bg.quotes).toMatchObject([{ verified: true, sourceKind: "direct", translationKo: null }]);

    const perspectives = await collections.listPerspectives(id);
    expect(perspectives.map((p) => [p.who, p.quotes[0].verified])).toEqual([
      ["기자", false],
      ["평론가 김", true],
    ]);

    // 찾기 1 + 읽기 2 (열지 못한 B 는 읽지 않는다). 보여 줄 수 있는 시선이 하나뿐이라 흔한 읽기는 부르지 않는다.
    expect(d.llm.calls.map(FakeLlm.stageOf)).toEqual(["find", "read", "read"]);
    expect(await collections.findById(id)).toMatchObject({
      status: "done",
      costUsd: 0.75,
      candidateCount: 3,
      models: ["model-x"],
      promptVersions: { find: "find.v1", read: "read.v1" },
    });
  });

  it("찾기는 웹 검색만, 읽기는 도구 없이 부르고 결과 형식을 함께 넘긴다", async () => {
    const d = deps(new FakeLlm(responder({})));
    await collectBook(d, await queued());
    const [findCall, readCall] = d.llm.calls;
    expect(findCall.tools).toBe("web-search");
    expect(findCall.prompt).toContain("『채식주의자』, 한강");
    expect(findCall.jsonSchema).toMatchObject({ type: "object" });
    expect(readCall.tools).toBe("none");
    expect(readCall.prompt).toContain(ARTICLE_A);
  });

  it("인용은 페이지 전체 글자와 대조한다 (기사 본문 밖에 있어도 통과)", async () => {
    const pages = new FakePageFetcher({
      [A]: { status: "ok", finalUrl: A, pageText: `머리말: 이 인터뷰는 2024년에 했다. ${ARTICLE_A}`, articleText: ARTICLE_A },
    });
    const llm = new FakeLlm(
      responder({
        find: [candidates(A)],
        reads: { [A]: [{ background: [{ topic: "era", claim_ko: "2024년", quotes: [q("이 인터뷰는 2024년에 했다.")] }], perspectives: [] }] },
      }),
    );
    const id = await queued();
    await collectBook(deps(llm, pages), id);
    expect((await collections.listBackgroundItems(id))[0].quotes[0].verified).toBe(true);
  });

  it("한국어가 아닌 인용은 옮김을 남기고, 한국어 인용의 빈 옮김은 null", async () => {
    const llm = new FakeLlm(
      responder({
        find: [candidates(A)],
        reads: {
          [A]: [
            {
              background: [],
              perspectives: [
                {
                  who: "평론가",
                  role: "critic",
                  reading_ko: "요약",
                  quotes: [q("The body resists the violence.", { lang: "EN", translation_ko: "몸이 폭력에 저항한다." })],
                },
              ],
            },
          ],
        },
      }),
    );
    const pages = new FakePageFetcher({ [A]: FakePageFetcher.page("Critics agree. The body resists the violence. End.") });
    const id = await queued();
    await collectBook(deps(llm, pages), id);
    expect((await collections.listPerspectives(id))[0].quotes[0]).toMatchObject({
      lang: "en",
      translationKo: "몸이 폭력에 저항한다.",
      verified: true,
    });
  });

  it("같은 주소(조각만 다름)와 http(s) 가 아닌 주소는 한 번만, 또는 열지 않는다", async () => {
    const d = deps(new FakeLlm(responder({ find: [candidates(A, `${A}#top`, "ftp://x.example.com/a", "아무 말", C)] })));
    const id = await queued();
    await collectBook(d, id);
    expect(d.pages.requested).toEqual([A, C]);
    expect((await collections.findById(id))?.candidateCount).toBe(5);
  });

  it(`출처는 많아야 ${MAX_SOURCES}개까지 연다`, async () => {
    const many = Array.from({ length: find.MAX_CANDIDATES + 2 }, (_, i) => `https://s${i}.example.com/`);
    const d = deps(new FakeLlm(responder({ find: [candidates(...many)] })));
    await collectBook(d, await queued());
    expect(d.pages.requested).toEqual(many.slice(0, MAX_SOURCES));
  });

  it("결과 형식이 틀리면 한 번 다시 묻는다. 두 호출의 비용을 모두 센다", async () => {
    const d = deps(new FakeLlm(responder({ find: [{ wrong: true }, candidates(A)] })));
    const id = await queued();
    expect((await collectBook(d, id)).status).toBe("done");
    expect(d.llm.calls.map(FakeLlm.stageOf)).toEqual(["find", "find", "read"]);
    expect((await collections.findById(id))?.costUsd).toBeCloseTo(0.3);
  });

  it("찾기가 두 번 다 실패하면 수집은 실패하고 이유가 남는다", async () => {
    const d = deps(new FakeLlm(responder({ find: [new Error("CLI 시간 초과")] })));
    const id = await queued();
    const r = await collectBook(d, id);
    expect(r).toMatchObject({ status: "failed" });
    expect(d.llm.calls).toHaveLength(2);
    const c = await collections.findById(id);
    expect(c).toMatchObject({ status: "failed", costUsd: 0 });
    expect(c?.error).toContain("CLI 시간 초과");
  });

  it("한 출처의 읽기가 실패해도 나머지는 계속한다. 실패 이유는 그 출처에 남는다", async () => {
    const d = deps(new FakeLlm(responder({ reads: { [A]: [new Error("응답 없음")], [C]: [readC] } })));
    const id = await queued();
    expect((await collectBook(d, id)).status).toBe("done");
    const sources = await collections.listSources(id);
    expect(sources[0].readError).toContain("응답 없음");
    expect(sources[2].readError).toBeNull();
    expect((await collections.listPerspectives(id)).map((p) => p.who)).toEqual(["평론가 김"]);
  });

  it("가져오기가 던져도 그 출처만 열지 못함으로 남긴다", async () => {
    const pages = new FakePageFetcher({ [A]: new Error("소켓 끊김"), [C]: FakePageFetcher.page(ARTICLE_C) });
    const id = await queued();
    expect((await collectBook(deps(new FakeLlm(responder({})), pages), id)).status).toBe("done");
    expect((await collections.listSources(id))[0]).toMatchObject({ fetchStatus: "unreachable", fetchError: "소켓 끊김" });
  });

  it("항목과 인용 수는 지시문의 상한까지만 남긴다", async () => {
    const quote = q("인간의 폭력에 대해 쓰고 싶었습니다.");
    const many: ReadOutput = {
      background: Array.from({ length: read.MAX_BACKGROUND + 2 }, () => ({ topic: "other" as const, claim_ko: "x", quotes: [quote, quote, quote] })),
      perspectives: [],
    };
    const id = await queued();
    await collectBook(deps(new FakeLlm(responder({ find: [candidates(A)], reads: { [A]: [many] } }))), id);
    const items = await collections.listBackgroundItems(id);
    expect(items).toHaveLength(read.MAX_BACKGROUND);
    expect(items[0].quotes).toHaveLength(read.MAX_QUOTES_PER_ITEM);
  });

  describe("흔한 읽기", () => {
    const urls = [A, C, "https://d.example.com/", "https://e.example.com/"];
    const text = (i: number) => `독자 ${i} 는 이 책을 이렇게 읽었다고 길게 적었다.`;
    const pages = () =>
      new FakePageFetcher(Object.fromEntries(urls.map((u, i) => [u, FakePageFetcher.page(text(i))])));
    const readFor = (i: number, verified: boolean): ReadOutput => ({
      background: [],
      perspectives: [{ who: `독자 ${i}`, role: "reader", reading_ko: `해석 ${i}`, quotes: [q(verified ? text(i) : "본문에 없는 문장을 지어냈다")] }],
    });

    it("보여 줄 수 있는 시선이 셋 이상이면 그 시선만 놓고 붙인다", async () => {
      let prevalenceCall: LlmCall | undefined;
      const base = responder({
        find: [candidates(...urls)],
        reads: Object.fromEntries(urls.map((u, i) => [u, [readFor(i, i < 3)]])),
      });
      const id = await queued();
      const llm = new FakeLlm((call, i) => {
        if (FakeLlm.stageOf(call) !== "prevalence") return base(call, i);
        prevalenceCall = call;
        const ids = [...call.prompt.matchAll(/id: (\S+)/g)].map((m) => m[1]);
        return { labels: [{ id: ids[0], prevalence: "majority" }, { id: ids[1], prevalence: "rare" }, { id: "없는-id", prevalence: "some" }] };
      });
      await collectBook(deps(llm, pages()), id);

      expect(prevalenceCall?.tools).toBe("none");
      expect(prevalenceCall?.prompt).not.toContain("해석 3");
      expect((await collections.listPerspectives(id)).map((p) => [p.who, p.prevalence])).toEqual([
        ["독자 0", "majority"],
        ["독자 1", "rare"],
        ["독자 2", "unknown"],
        ["독자 3", "unknown"],
      ]);
      expect((await collections.findById(id))?.promptVersions).toMatchObject({ prevalence: "prevalence.v1" });
    });

    it("흔한 읽기 호출이 실패해도 수집은 끝나고 모두 알 수 없음", async () => {
      const llm = new FakeLlm(
        responder({
          find: [candidates(...urls)],
          reads: Object.fromEntries(urls.map((u, i) => [u, [readFor(i, true)]])),
          prevalence: [new Error("실패")],
        }),
      );
      const id = await queued();
      expect((await collectBook(deps(llm, pages()), id)).status).toBe("done");
      expect((await collections.listPerspectives(id)).every((p) => p.prevalence === "unknown")).toBe(true);
    });
  });

  it("대기 상태가 아닌 수집은 건너뛴다", async () => {
    const id = await queued();
    await collections.markRunning(id);
    const d = deps(new FakeLlm(responder({})));
    expect(await collectBook(d, id)).toEqual({ status: "skipped" });
    expect(await collectBook(d, "00000000-0000-4000-8000-0000000000cc")).toEqual({ status: "skipped" });
    expect(d.llm.calls).toEqual([]);
  });
});

describe("collectionReport", () => {
  it("최근 수집의 출처·항목·대조 결과·비용을 센다", async () => {
    const id = await queued();
    await collectBook(deps(new FakeLlm(responder({}), { costUsd: 0.25 })), id);
    const r = await collectionReport({ books, collections }, bookId);
    expect(r?.counts).toEqual({
      candidates: 3,
      sourcesOk: 2,
      sourcesUnreachable: 1,
      readFailures: 0,
      quotes: 3,
      verifiedQuotes: 2,
      background: 1,
      showableBackground: 1,
      perspectives: 2,
      showablePerspectives: 1,
    });
    expect(r?.collection).toMatchObject({ id, status: "done", costUsd: 0.75 });
    expect(r?.book.title).toBe("채식주의자");
  });

  it("수집이 없는 책이나 없는 책은 null", async () => {
    expect(await collectionReport({ books, collections }, bookId)).toBeNull();
    expect(await collectionReport({ books, collections }, "abc")).toBeNull();
  });
});
