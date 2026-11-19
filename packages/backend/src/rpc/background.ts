import type { BackgroundItemDto } from "@inkle/contract/background";
import { backgroundView, recollect, type ShownBackgroundItem } from "../application/connections";
import { currentUser } from "../application/users";
import { os } from "./os";
import { quoteDto } from "./quote-dto";

const itemDto = (item: ShownBackgroundItem): BackgroundItemDto => ({
  id: item.id,
  topic: item.topic,
  claim: item.claimKo,
  claimAuthor: "ai",
  source: item.source,
  quotes: item.quotes.map(quoteDto),
});

// 사용자는 요청에서 받지 않고 서버가 정한다 (ADR-003 §4). 모두 문(門)을 거친다.
export const background = {
  get: os.background.get.handler(async ({ context, input, errors }) => {
    const user = await currentUser(context.users);
    const r = await backgroundView(context, user.id, input.sessionId);
    if (r.status === "not_found") throw errors.NOT_FOUND();
    if (r.status === "locked") throw errors.LOCKED();
    return {
      collection: r.view.collection,
      connections: r.view.connections,
      connected: r.view.connected.map(({ item, connection }) => ({
        item: itemDto(item),
        connection: {
          myQuote: connection.myQuote,
          myQuoteAuthor: "me" as const,
          questionId: connection.questionId,
          note: connection.noteKo,
          noteAuthor: "ai" as const,
        },
      })),
      others: r.view.others.map((g) => ({ topic: g.topic, items: g.items.map(itemDto) })),
    };
  }),

  recollect: os.background.recollect.handler(async ({ context, input, errors }) => {
    const user = await currentUser(context.users);
    const r = await recollect(context, user.id, input.sessionId);
    if (r.status === "not_found") throw errors.NOT_FOUND();
    if (r.status === "locked") throw errors.LOCKED();
    return { collection: r.collection };
  }),
};
