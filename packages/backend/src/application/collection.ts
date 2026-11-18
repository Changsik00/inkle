// 자료 수집의 유스케이스 (ADR-004 §2). 찾기 → 가져오기 → 읽기 → 대조 → 흔한 읽기.
// LLM 과 페이지 가져오기는 포트 뒤에 있다. 이 파일은 순서와 규칙만 갖는다.
import { z } from "zod";
import type {
  BookRepository,
  CollectionOutcome,
  CollectionRepository,
  FetchedPage,
  JobRepository,
  LlmClient,
  LlmTools,
  NewQuote,
  PageFetcher,
} from "./ports";
import * as find from "./prompts/find.v1";
import * as prevalence from "./prompts/prevalence.v1";
import * as read from "./prompts/read.v1";
import { isBookId, type Book } from "../domain/book";
import {
  applyPrevalence,
  blocksNewCollection,
  isShowable,
  MIN_PERSPECTIVES_FOR_PREVALENCE,
  type BackgroundItem,
  type Collection,
  type Perspective,
  type Source,
  type SourceRole,
} from "../domain/collection";
import { isUuid } from "../domain/id";
import { matchQuote } from "../domain/quote-match";

export const COLLECT_BOOK_JOB = "collect-book";

/** 한 수집에서 여는 출처의 수. 읽기 호출 수가 여기에 묶인다. */
export const MAX_SOURCES = 8;

export type CollectDeps = {
  books: BookRepository;
  collections: CollectionRepository;
  llm: LlmClient;
  pages: PageFetcher;
};

// ── 대기열에 넣기 (ADR-004 §7). 오래 멈춘 대기·진행 중 수집은 막지 않는다 (작업이 버려진 경우)

export async function enqueueCollection(
  deps: { collections: CollectionRepository; jobs: JobRepository },
  bookId: string,
  options: { force?: boolean; now?: Date } = {},
): Promise<{ status: "queued"; collectionId: string; jobId: number } | { status: "exists"; collection: Collection }> {
  const latest = await deps.collections.latestForBook(bookId);
  if (latest && blocksNewCollection(latest, options.now ?? new Date()) && !options.force) return { status: "exists", collection: latest };
  const collection = await deps.collections.create(bookId);
  const jobId = await deps.jobs.enqueue(COLLECT_BOOK_JOB, { collectionId: collection.id });
  return { status: "queued", collectionId: collection.id, jobId };
}

export const collectBookPayload = z.object({ collectionId: z.string() });

// ── LLM 한 번 묻기: 결과를 다시 검사하고, 틀리거나 실패하면 한 번 더 묻는다

type Ledger = { costUsd: number; models: Set<string> };

type Asked<T> = { ok: true; value: T; model: string } | { ok: false; error: string };

async function ask<T>(llm: LlmClient, ledger: Ledger, prompt: string, schema: z.ZodType<T>, tools: LlmTools): Promise<Asked<T>> {
  // CLI 의 검사기는 zod 가 붙이는 $schema(2020-12) 를 알지 못해 거부한다. 형식 자체만 넘긴다.
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  void _dialect;
  let error = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await llm.run({ prompt, jsonSchema, tools });
      ledger.costUsd += r.costUsd;
      ledger.models.add(r.model);
      const parsed = schema.safeParse(r.output);
      if (parsed.success) return { ok: true, value: parsed.data, model: r.model };
      error = `결과 형식이 맞지 않음: ${parsed.error.issues.map((i) => i.path.join(".") || "(전체)").join(", ")}`;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, error };
}

// ── 수집

/** 조각(#…)을 떼고 http(s) 만 남긴다. 같은 글을 두 번 열지 않기 위해 쓴다. */
function canonicalUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

function pickCandidates(output: find.Output): { url: string; who: string; role: SourceRole }[] {
  const seen = new Set<string>();
  const picked: { url: string; who: string; role: SourceRole }[] = [];
  for (const c of output.candidates.slice(0, find.MAX_CANDIDATES)) {
    const url = canonicalUrl(c.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    picked.push({ url, who: c.who.trim(), role: c.use });
  }
  return picked.slice(0, MAX_SOURCES);
}

async function fetchPage(pages: PageFetcher, url: string): Promise<FetchedPage> {
  try {
    return await pages.fetch(url);
  } catch (e) {
    return { status: "unreachable", reason: e instanceof Error ? e.message : String(e) };
  }
}

function truncate(text: string, max: number): string {
  const chars = [...text];
  return chars.length <= max ? text : chars.slice(0, max).join("");
}

function toQuotes(quotes: read.Output["background"][number]["quotes"], page: { pageText: string; articleText: string }): NewQuote[] {
  return quotes.slice(0, read.MAX_QUOTES_PER_ITEM).map((q) => {
    const lang = q.lang.trim().toLowerCase() || "ko";
    const translation = q.translation_ko.trim();
    return {
      text: q.text.trim(),
      lang,
      translationKo: lang === "ko" || !translation ? null : translation,
      sourceKind: q.source_kind,
      // 페이지 전체와 대조한다. 기사 본문만 고르는 과정에서 문장이 빠질 수 있어서다 (spec-01-03 가정 4).
      verified: matchQuote(q.text, page.pageText).verified || matchQuote(q.text, page.articleText).verified,
    };
  });
}

export type CollectResult = { status: "done" } | { status: "failed"; error: string } | { status: "skipped" };

export async function collectBook(deps: CollectDeps, collectionId: string): Promise<CollectResult> {
  const collection = isUuid(collectionId) ? await deps.collections.findById(collectionId) : null;
  if (!collection || collection.status !== "queued") return { status: "skipped" };
  await deps.collections.markRunning(collection.id);

  const ledger: Ledger = { costUsd: 0, models: new Set() };
  const promptVersions: Record<string, string> = {};
  let candidateCount = 0;
  const outcome = (): CollectionOutcome => ({
    models: [...ledger.models],
    promptVersions,
    costUsd: Math.round(ledger.costUsd * 1e6) / 1e6,
    candidateCount,
  });
  const fail = async (error: string): Promise<CollectResult> => {
    await deps.collections.markFailed(collection.id, error, outcome());
    return { status: "failed", error };
  };

  try {
    const book = await deps.books.findById(collection.bookId);
    if (!book) return await fail("책이 없다");

    // 1. 찾기
    promptVersions.find = find.version;
    const found = await ask(deps.llm, ledger, find.render(book), find.schema, "web-search");
    if (!found.ok) return await fail(`찾기 실패: ${found.error}`);
    candidateCount = found.value.candidates.length;

    // 2~4. 출처마다 가져오기 → 읽기 → 대조
    const perspectives: Perspective[] = [];
    for (const candidate of pickCandidates(found.value)) {
      perspectives.push(...(await collectSource(deps, ledger, promptVersions, book, collection.id, candidate)));
    }

    // 5. 흔한 읽기
    await labelPrevalence(deps, ledger, promptVersions, book, perspectives.filter(isShowable));

    await deps.collections.markDone(collection.id, outcome());
    return { status: "done" };
  } catch (e) {
    return await fail(e instanceof Error ? e.message : String(e));
  }
}

async function collectSource(
  deps: CollectDeps,
  ledger: Ledger,
  promptVersions: Record<string, string>,
  book: Book,
  collectionId: string,
  candidate: { url: string; who: string; role: SourceRole },
): Promise<Perspective[]> {
  const page = await fetchPage(deps.pages, candidate.url);
  const base = { collectionId, bookId: book.id, url: candidate.url, who: candidate.who, role: candidate.role };
  if (page.status === "unreachable") {
    await deps.collections.addSource({
      ...base,
      finalUrl: null,
      fetchStatus: "unreachable",
      fetchError: page.reason,
      pageText: null,
      articleText: null,
      readError: null,
    });
    return [];
  }

  promptVersions.read = read.version;
  const prompt = read.render({ book, url: candidate.url, who: candidate.who, article: truncate(page.articleText, read.MAX_ARTICLE_CHARS) });
  const answer = await ask(deps.llm, ledger, prompt, read.schema, "none");
  const source = await deps.collections.addSource({
    ...base,
    finalUrl: page.finalUrl,
    fetchStatus: "ok",
    fetchError: null,
    pageText: page.pageText,
    articleText: page.articleText,
    readError: answer.ok ? null : answer.error,
  });
  if (!answer.ok) return [];

  const provenance = { collectionId, model: answer.model, promptVersion: read.version, bookId: book.id, sourceId: source.id };
  for (const item of answer.value.background.slice(0, read.MAX_BACKGROUND)) {
    await deps.collections.addBackgroundItem({
      ...provenance,
      topic: item.topic,
      claimKo: item.claim_ko.trim(),
      quotes: toQuotes(item.quotes, page),
    });
  }
  const added: Perspective[] = [];
  for (const item of answer.value.perspectives.slice(0, read.MAX_PERSPECTIVES)) {
    added.push(
      await deps.collections.addPerspective({
        ...provenance,
        who: item.who.trim() || candidate.who,
        role: item.role,
        readingKo: item.reading_ko.trim(),
        quotes: toQuotes(item.quotes, page),
      }),
    );
  }
  return added;
}

async function labelPrevalence(
  deps: CollectDeps,
  ledger: Ledger,
  promptVersions: Record<string, string>,
  book: Book,
  showable: Perspective[],
): Promise<void> {
  const ids = showable.map((p) => p.id);
  // 시선이 적으면 부르지 않는다. 모두 처음 값인 "알 수 없음"으로 남는다.
  if (ids.length < MIN_PERSPECTIVES_FOR_PREVALENCE) return;
  promptVersions.prevalence = prevalence.version;
  const answer = await ask(deps.llm, ledger, prevalence.render({ book, perspectives: showable }), prevalence.schema, "none");
  if (!answer.ok) return;
  const labels = Object.fromEntries(answer.value.labels.map((l) => [l.id, l.prevalence]));
  for (const [id, value] of Object.entries(applyPrevalence(ids, labels))) {
    if (value !== "unknown") await deps.collections.setPrevalence(id, value);
  }
}

// ── 보고서 (손으로 확인하는 명령이 쓴다)

export type CollectionReport = {
  book: Book;
  collection: Collection;
  sources: Source[];
  background: BackgroundItem[];
  perspectives: Perspective[];
  counts: {
    candidates: number;
    sourcesOk: number;
    sourcesUnreachable: number;
    readFailures: number;
    quotes: number;
    verifiedQuotes: number;
    background: number;
    showableBackground: number;
    perspectives: number;
    showablePerspectives: number;
  };
};

export async function collectionReport(
  deps: { books: BookRepository; collections: CollectionRepository },
  bookId: string,
): Promise<CollectionReport | null> {
  const book = isBookId(bookId) ? await deps.books.findById(bookId) : null;
  if (!book) return null;
  const collection = await deps.collections.latestForBook(book.id);
  if (!collection) return null;
  const [sources, background, perspectives] = await Promise.all([
    deps.collections.listSources(collection.id),
    deps.collections.listBackgroundItems(collection.id),
    deps.collections.listPerspectives(collection.id),
  ]);
  const quotes = [...background, ...perspectives].flatMap((i) => i.quotes);
  return {
    book,
    collection,
    sources,
    background,
    perspectives,
    counts: {
      candidates: collection.candidateCount,
      sourcesOk: sources.filter((s) => s.fetchStatus === "ok").length,
      sourcesUnreachable: sources.filter((s) => s.fetchStatus === "unreachable").length,
      readFailures: sources.filter((s) => s.readError !== null).length,
      quotes: quotes.length,
      verifiedQuotes: quotes.filter((q) => q.verified).length,
      background: background.length,
      showableBackground: background.filter(isShowable).length,
      perspectives: perspectives.length,
      showablePerspectives: perspectives.filter(isShowable).length,
    },
  };
}
