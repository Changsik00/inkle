import type { TransactionSql } from "postgres";
import { z } from "zod";
import type {
  CollectionOutcome,
  CollectionRepository,
  NewBackgroundItem,
  NewImaginedPerspective,
  NewPerspective,
  NewQuote,
  NewSource,
} from "../../application/ports";
import {
  BACKGROUND_TOPICS,
  COLLECTION_STATUSES,
  PERSPECTIVE_ROLES,
  PREVALENCES,
  QUOTE_SOURCE_KINDS,
  SOURCE_ROLES,
  type BackgroundItem,
  type Collection,
  type ImaginedPerspective,
  type Perspective,
  type Prevalence,
  type Quote,
  type Source,
} from "../../domain/collection";
import type { Sql } from "../db/client";

const collectionRow = z.object({
  id: z.uuid(),
  book_id: z.uuid(),
  status: z.enum(COLLECTION_STATUSES),
  error: z.string().nullable(),
  models: z.array(z.string()),
  prompt_versions: z.record(z.string(), z.string()),
  cost_usd: z.number(),
  candidate_count: z.number().int(),
  created_at: z.date(),
  started_at: z.date().nullable(),
  finished_at: z.date().nullable(),
});

function toCollection(raw: unknown): Collection {
  const r = collectionRow.parse(raw);
  return {
    id: r.id,
    bookId: r.book_id,
    status: r.status,
    error: r.error,
    models: r.models,
    promptVersions: r.prompt_versions,
    costUsd: r.cost_usd,
    candidateCount: r.candidate_count,
    createdAt: r.created_at,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
  };
}

const sourceRow = z.object({
  id: z.uuid(),
  collection_id: z.uuid(),
  book_id: z.uuid(),
  url: z.string(),
  final_url: z.string().nullable(),
  who: z.string(),
  role: z.enum(SOURCE_ROLES),
  fetch_status: z.enum(["ok", "unreachable"]),
  fetch_error: z.string().nullable(),
  page_text: z.string().nullable(),
  article_text: z.string().nullable(),
  read_error: z.string().nullable(),
  fetched_at: z.date(),
});

function toSource(raw: unknown): Source {
  const r = sourceRow.parse(raw);
  return {
    id: r.id,
    collectionId: r.collection_id,
    bookId: r.book_id,
    url: r.url,
    finalUrl: r.final_url,
    who: r.who,
    role: r.role,
    fetchStatus: r.fetch_status,
    fetchError: r.fetch_error,
    pageText: r.page_text,
    articleText: r.article_text,
    readError: r.read_error,
    fetchedAt: r.fetched_at,
  };
}

const quoteRow = z.object({
  id: z.uuid(),
  source_id: z.uuid(),
  background_item_id: z.uuid().nullable(),
  perspective_id: z.uuid().nullable(),
  text: z.string(),
  lang: z.string(),
  translation_ko: z.string().nullable(),
  source_kind: z.enum(QUOTE_SOURCE_KINDS),
  verified: z.boolean(),
});

type QuoteRow = z.infer<typeof quoteRow>;

const toQuote = (r: QuoteRow): Quote => ({
  id: r.id,
  sourceId: r.source_id,
  text: r.text,
  lang: r.lang,
  translationKo: r.translation_ko,
  sourceKind: r.source_kind,
  verified: r.verified,
});

const backgroundRow = z.object({
  id: z.uuid(),
  collection_id: z.uuid(),
  book_id: z.uuid(),
  source_id: z.uuid(),
  topic: z.enum(BACKGROUND_TOPICS),
  claim_ko: z.string(),
  model: z.string(),
  prompt_version: z.string(),
});

const perspectiveRow = z.object({
  id: z.uuid(),
  collection_id: z.uuid(),
  book_id: z.uuid(),
  source_id: z.uuid(),
  who: z.string(),
  role: z.enum(PERSPECTIVE_ROLES),
  reading_ko: z.string(),
  prevalence: z.enum(PREVALENCES),
  model: z.string(),
  prompt_version: z.string(),
});

const imaginedRow = z.object({
  id: z.uuid(),
  collection_id: z.uuid(),
  book_id: z.uuid(),
  reading_ko: z.string(),
  model: z.string(),
  prompt_version: z.string(),
});

const toImagined = (raw: unknown): ImaginedPerspective => {
  const r = imaginedRow.parse(raw);
  return { id: r.id, collectionId: r.collection_id, bookId: r.book_id, readingKo: r.reading_ko, model: r.model, promptVersion: r.prompt_version };
};

const COLLECTION_COLUMNS = "id, book_id, status, error, models, prompt_versions, cost_usd, candidate_count, created_at, started_at, finished_at";
const SOURCE_COLUMNS =
  "id, collection_id, book_id, url, final_url, who, role, fetch_status, fetch_error, page_text, article_text, read_error, fetched_at";
const QUOTE_COLUMNS = "id, source_id, background_item_id, perspective_id, text, lang, translation_ko, source_kind, verified";

export class PostgresCollectionRepository implements CollectionRepository {
  constructor(private readonly sql: Sql) {}

  async create(bookId: string): Promise<Collection> {
    const [row] = await this.sql`
      insert into collections (book_id) values (${bookId}) returning ${this.sql.unsafe(COLLECTION_COLUMNS)}`;
    return toCollection(row);
  }

  async findById(id: string): Promise<Collection | null> {
    const rows = await this.sql`select ${this.sql.unsafe(COLLECTION_COLUMNS)} from collections where id = ${id}`;
    return rows.length ? toCollection(rows[0]) : null;
  }

  async latestForBook(bookId: string): Promise<Collection | null> {
    const rows = await this.sql`
      select ${this.sql.unsafe(COLLECTION_COLUMNS)} from collections
      where book_id = ${bookId} order by created_at desc limit 1`;
    return rows.length ? toCollection(rows[0]) : null;
  }

  async markRunning(id: string): Promise<void> {
    await this.sql`update collections set status = 'running', started_at = clock_timestamp() where id = ${id}`;
  }

  async markDone(id: string, outcome: CollectionOutcome): Promise<void> {
    await this.finish(id, "done", null, outcome);
  }

  async markFailed(id: string, error: string, outcome: CollectionOutcome): Promise<void> {
    await this.finish(id, "failed", error, outcome);
  }

  private async finish(id: string, status: "done" | "failed", error: string | null, o: CollectionOutcome) {
    await this.sql`
      update collections set
        status = ${status}, error = ${error}, models = ${this.sql.json(o.models)},
        prompt_versions = ${this.sql.json(o.promptVersions)}, cost_usd = ${o.costUsd},
        candidate_count = ${o.candidateCount}, finished_at = clock_timestamp()
      where id = ${id}`;
  }

  async addSource(s: NewSource): Promise<Source> {
    const [row] = await this.sql`
      insert into sources (collection_id, book_id, url, final_url, who, role, fetch_status, fetch_error, page_text, article_text, read_error)
      values (${s.collectionId}, ${s.bookId}, ${s.url}, ${s.finalUrl}, ${s.who}, ${s.role}, ${s.fetchStatus},
              ${s.fetchError}, ${s.pageText}, ${s.articleText}, ${s.readError})
      returning ${this.sql.unsafe(SOURCE_COLUMNS)}`;
    return toSource(row);
  }

  async listSources(collectionId: string): Promise<Source[]> {
    const rows = await this.sql`
      select ${this.sql.unsafe(SOURCE_COLUMNS)} from sources where collection_id = ${collectionId} order by seq`;
    return rows.map(toSource);
  }

  async addBackgroundItem(item: NewBackgroundItem): Promise<BackgroundItem> {
    return this.sql.begin(async (tx) => {
      const [raw] = await tx`
        insert into background_items (collection_id, book_id, source_id, topic, claim_ko, model, prompt_version)
        values (${item.collectionId}, ${item.bookId}, ${item.sourceId}, ${item.topic}, ${item.claimKo}, ${item.model}, ${item.promptVersion})
        returning id, collection_id, book_id, source_id, topic, claim_ko, model, prompt_version`;
      const r = backgroundRow.parse(raw);
      const quotes = await insertQuotes(tx, item.sourceId, { background_item_id: r.id }, item.quotes);
      return toBackground(r, quotes);
    }) as Promise<BackgroundItem>;
  }

  async addPerspective(item: NewPerspective): Promise<Perspective> {
    return this.sql.begin(async (tx) => {
      const [raw] = await tx`
        insert into perspectives (collection_id, book_id, source_id, who, role, reading_ko, model, prompt_version)
        values (${item.collectionId}, ${item.bookId}, ${item.sourceId}, ${item.who}, ${item.role}, ${item.readingKo}, ${item.model}, ${item.promptVersion})
        returning id, collection_id, book_id, source_id, who, role, reading_ko, prevalence, model, prompt_version`;
      const r = perspectiveRow.parse(raw);
      const quotes = await insertQuotes(tx, item.sourceId, { perspective_id: r.id }, item.quotes);
      return toPerspective(r, quotes);
    }) as Promise<Perspective>;
  }

  async setPrevalence(perspectiveId: string, prevalence: Prevalence): Promise<void> {
    await this.sql`update perspectives set prevalence = ${prevalence} where id = ${perspectiveId}`;
  }

  async listBackgroundItems(collectionId: string): Promise<BackgroundItem[]> {
    const rows = await this.sql`
      select id, collection_id, book_id, source_id, topic, claim_ko, model, prompt_version
      from background_items where collection_id = ${collectionId} order by seq`;
    const quotes = await this.quotesFor("background_item_id", rows.map((r) => r.id as string));
    return rows.map((raw) => {
      const r = backgroundRow.parse(raw);
      return toBackground(r, quotes.get(r.id) ?? []);
    });
  }

  async listPerspectives(collectionId: string): Promise<Perspective[]> {
    const rows = await this.sql`
      select id, collection_id, book_id, source_id, who, role, reading_ko, prevalence, model, prompt_version
      from perspectives where collection_id = ${collectionId} and kind = 'external' order by seq`;
    const quotes = await this.quotesFor("perspective_id", rows.map((r) => r.id as string));
    return rows.map((raw) => {
      const r = perspectiveRow.parse(raw);
      return toPerspective(r, quotes.get(r.id) ?? []);
    });
  }

  async addImaginedPerspective(item: NewImaginedPerspective): Promise<ImaginedPerspective> {
    const [raw] = await this.sql`
      insert into perspectives (collection_id, book_id, kind, reading_ko, model, prompt_version)
      values (${item.collectionId}, ${item.bookId}, 'imagined', ${item.readingKo}, ${item.model}, ${item.promptVersion})
      returning id, collection_id, book_id, reading_ko, model, prompt_version`;
    return toImagined(raw);
  }

  async listImaginedPerspectives(collectionId: string): Promise<ImaginedPerspective[]> {
    const rows = await this.sql`
      select id, collection_id, book_id, reading_ko, model, prompt_version
      from perspectives where collection_id = ${collectionId} and kind = 'imagined' order by seq`;
    return rows.map(toImagined);
  }

  private async quotesFor(column: "background_item_id" | "perspective_id", ids: string[]): Promise<Map<string, Quote[]>> {
    const byOwner = new Map<string, Quote[]>();
    if (!ids.length) return byOwner;
    const rows = await this.sql`
      select ${this.sql.unsafe(QUOTE_COLUMNS)} from quotes where ${this.sql(column)} = any(${ids}::uuid[]) order by seq`;
    for (const raw of rows) {
      const r = quoteRow.parse(raw);
      const owner = (column === "background_item_id" ? r.background_item_id : r.perspective_id)!;
      byOwner.set(owner, [...(byOwner.get(owner) ?? []), toQuote(r)]);
    }
    return byOwner;
  }
}

type Tx = TransactionSql;

async function insertQuotes(
  tx: Tx,
  sourceId: string,
  owner: { background_item_id: string } | { perspective_id: string },
  quotes: NewQuote[],
): Promise<Quote[]> {
  const background = "background_item_id" in owner ? owner.background_item_id : null;
  const perspective = "perspective_id" in owner ? owner.perspective_id : null;
  const out: Quote[] = [];
  for (const q of quotes) {
    const [raw] = await tx`
      insert into quotes (source_id, background_item_id, perspective_id, text, lang, translation_ko, source_kind, verified)
      values (${sourceId}, ${background}, ${perspective}, ${q.text}, ${q.lang}, ${q.translationKo}, ${q.sourceKind}, ${q.verified})
      returning ${tx.unsafe(QUOTE_COLUMNS)}`;
    out.push(toQuote(quoteRow.parse(raw)));
  }
  return out;
}

function toBackground(r: z.infer<typeof backgroundRow>, quotes: Quote[]): BackgroundItem {
  return {
    id: r.id,
    collectionId: r.collection_id,
    bookId: r.book_id,
    sourceId: r.source_id,
    topic: r.topic,
    claimKo: r.claim_ko,
    model: r.model,
    promptVersion: r.prompt_version,
    quotes,
  };
}

function toPerspective(r: z.infer<typeof perspectiveRow>, quotes: Quote[]): Perspective {
  return {
    id: r.id,
    collectionId: r.collection_id,
    bookId: r.book_id,
    sourceId: r.source_id,
    who: r.who,
    role: r.role,
    readingKo: r.reading_ko,
    prevalence: r.prevalence,
    model: r.model,
    promptVersion: r.prompt_version,
    quotes,
  };
}
