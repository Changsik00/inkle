// 다른 시선 보기 (spec-01-10). 문(門)을 거친다: 내 해석을 저장하기 전에는 내주지 않는다 (ADR-004 §7).
// 시선은 책 단위 자료다 (ADR-002 §1). 그 책의 가장 최근 수집이 끝났을 때 그 수집의 것을 내준다.
import { collectionState, type CollectionState } from "./collection";
import { requireUnlocked, type SessionDeps } from "./sessions";
import {
  arrangePerspectives,
  isShowable,
  prevalenceOf,
  type ImaginedPerspective,
  type Perspective,
  type Prevalence,
  type Quote,
} from "../domain/collection";

/** 화면에 내주는 외부 사람의 시선: 대조를 통과한 인용만, 출처와 함께. 작가 본인이면 흔함 정도가 없다 */
export type ShownPerspective = Pick<Perspective, "id" | "who" | "role" | "readingKo"> & {
  prevalence: Prevalence | null;
  quotes: Quote[];
  source: { url: string; who: string };
};

export type PerspectivesView = {
  collection: CollectionState;
  /** 작가 본인이 아닌 사람의 시선, 흔한 것부터 */
  others: ShownPerspective[];
  /** 작가 본인의 시선 */
  author: ShownPerspective[];
  /** AI 가 만든 해석 (다른 사람의 시선이 모자랄 때만 있다) */
  imagined: Pick<ImaginedPerspective, "id" | "readingKo">[];
};

export async function perspectivesView(
  deps: SessionDeps,
  userId: string,
  sessionId: string,
  now: Date = new Date(),
): Promise<{ status: "ok"; view: PerspectivesView } | { status: "locked" } | { status: "not_found" }> {
  const gate = await requireUnlocked(deps, userId, sessionId);
  if (gate.status !== "unlocked") return gate;

  const collection = await deps.collections.latestForBook(gate.session.bookId);
  const view: PerspectivesView = { collection: collectionState(collection, now), others: [], author: [], imagined: [] };
  if (!collection || collection.status !== "done") return { status: "ok", view };

  const [perspectives, imagined, sources] = await Promise.all([
    deps.collections.listPerspectives(collection.id),
    deps.collections.listImaginedPerspectives(collection.id),
    deps.collections.listSources(collection.id),
  ]);
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const toShown = (p: Perspective): ShownPerspective => {
    const source = sourceById.get(p.sourceId);
    return {
      id: p.id,
      who: p.who,
      role: p.role,
      readingKo: p.readingKo,
      prevalence: prevalenceOf(p),
      quotes: p.quotes.filter((q) => q.verified),
      source: { url: source?.finalUrl ?? source?.url ?? "", who: source?.who ?? "" },
    };
  };
  const arranged = arrangePerspectives(perspectives.filter(isShowable));
  view.others = arranged.others.map(toShown);
  view.author = arranged.author.map(toShown);
  view.imagined = imagined.map((p) => ({ id: p.id, readingKo: p.readingKo }));
  return { status: "ok", view };
}
