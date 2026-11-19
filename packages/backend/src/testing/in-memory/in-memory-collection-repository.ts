// 테스트용 CollectionRepository. 계약 테스트가 Postgres 구현과 같게 붙잡아 둔다.
import { randomUUID } from "node:crypto";
import type {
  CollectionOutcome,
  CollectionRepository,
  NewBackgroundItem,
  NewPerspective,
  NewQuote,
  NewSource,
} from "../../application/ports";
import type { BackgroundItem, Collection, Perspective, Prevalence, Quote, Source } from "../../domain/collection";

export class InMemoryCollectionRepository implements CollectionRepository {
  private readonly collections: Collection[] = [];
  private readonly sources: Source[] = [];
  private readonly background: BackgroundItem[] = [];
  private readonly perspectives: Perspective[] = [];

  async create(bookId: string): Promise<Collection> {
    const c: Collection = {
      id: randomUUID(),
      bookId,
      status: "queued",
      error: null,
      models: [],
      promptVersions: {},
      costUsd: 0,
      candidateCount: 0,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
    };
    this.collections.push(c);
    return structuredClone(c);
  }

  async findById(id: string): Promise<Collection | null> {
    const c = this.collections.find((x) => x.id === id);
    return c ? structuredClone(c) : null;
  }

  async latestForBook(bookId: string): Promise<Collection | null> {
    const c = this.collections.filter((x) => x.bookId === bookId).at(-1);
    return c ? structuredClone(c) : null;
  }

  async markRunning(id: string): Promise<void> {
    this.update(id, { status: "running", startedAt: new Date() });
  }

  async markDone(id: string, outcome: CollectionOutcome): Promise<void> {
    this.update(id, { ...structuredClone(outcome), status: "done", error: null, finishedAt: new Date() });
  }

  async markFailed(id: string, error: string, outcome: CollectionOutcome): Promise<void> {
    this.update(id, { ...structuredClone(outcome), status: "failed", error, finishedAt: new Date() });
  }

  async addSource(input: NewSource): Promise<Source> {
    const s: Source = { ...structuredClone(input), id: randomUUID(), fetchedAt: new Date() };
    this.sources.push(s);
    return structuredClone(s);
  }

  async listSources(collectionId: string): Promise<Source[]> {
    return this.sources.filter((s) => s.collectionId === collectionId).map((s) => structuredClone(s));
  }

  async addBackgroundItem(input: NewBackgroundItem): Promise<BackgroundItem> {
    const item: BackgroundItem = { ...structuredClone(input), id: randomUUID(), quotes: this.quotes(input.sourceId, input.quotes) };
    this.background.push(item);
    return structuredClone(item);
  }

  async addPerspective(input: NewPerspective): Promise<Perspective> {
    const item: Perspective = {
      ...structuredClone(input),
      id: randomUUID(),
      prevalence: "unknown",
      quotes: this.quotes(input.sourceId, input.quotes),
    };
    this.perspectives.push(item);
    return structuredClone(item);
  }

  async setPrevalence(perspectiveId: string, prevalence: Prevalence): Promise<void> {
    const p = this.perspectives.find((x) => x.id === perspectiveId);
    if (p) p.prevalence = prevalence;
  }

  async listBackgroundItems(collectionId: string): Promise<BackgroundItem[]> {
    return this.background.filter((x) => x.collectionId === collectionId).map((x) => structuredClone(x));
  }

  async listPerspectives(collectionId: string): Promise<Perspective[]> {
    return this.perspectives.filter((x) => x.collectionId === collectionId).map((x) => structuredClone(x));
  }

  private quotes(sourceId: string, quotes: NewQuote[]): Quote[] {
    return quotes.map((q) => ({ ...structuredClone(q), id: randomUUID(), sourceId }));
  }

  private update(id: string, patch: Partial<Collection>) {
    const c = this.collections.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
  }
}
