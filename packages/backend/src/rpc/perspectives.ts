import { perspectivesView, type ShownPerspective } from "../application/perspectives";
import { currentUser } from "../application/users";
import { os } from "./os";
import { quoteDto } from "./quote-dto";

const base = (p: ShownPerspective) => ({
  id: p.id,
  who: p.who,
  reading: p.readingKo,
  readingAuthor: "ai" as const,
  source: p.source,
  quotes: p.quotes.map(quoteDto),
});

// 사용자는 요청에서 받지 않고 서버가 정한다 (ADR-003 §4). 문(門)을 거친다.
export const perspectives = {
  get: os.perspectives.get.handler(async ({ context, input, errors }) => {
    const user = await currentUser(context.users);
    const r = await perspectivesView(context, user.id, input.sessionId);
    if (r.status === "not_found") throw errors.NOT_FOUND();
    if (r.status === "locked") throw errors.LOCKED();
    return {
      collection: r.view.collection,
      others: r.view.others.map((p) => {
        // 작가 본인이 아닌 시선은 언제나 흔함 정도와 author 가 아닌 역할을 갖는다 (domain/collection.ts arrangePerspectives)
        if (p.role === "author" || p.prevalence === null) throw new Error("작가 본인의 시선이 다른 사람 쪽에 들어왔다");
        return { ...base(p), role: p.role, prevalence: p.prevalence };
      }),
      author: r.view.author.map(base),
      imagined: r.view.imagined.map((p) => ({ id: p.id, reading: p.readingKo, readingAuthor: "ai" as const })),
    };
  }),
};
