import type { BackgroundViewDto } from "@inkle/contract/background";
import { http, HttpResponse } from "msw";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { BackgroundView } from "@/features/background/background-screen";
import {
  backgroundItemDto,
  backgroundViewDto,
  definedError,
  interpretationDto,
  SESSION_ID,
  sessionViewDto,
} from "@/testing/fixtures";
import { renderWithProviders } from "@/testing/render";
import { test } from "@/testing/test";

const savedSession = () =>
  http.get(`/api/sessions/${SESSION_ID}`, () =>
    HttpResponse.json(sessionViewDto({ stage: "interpretation_saved", interpretation: interpretationDto() })),
  );

const backgroundAnswer = (body: BackgroundViewDto) => http.get(`/api/sessions/${SESSION_ID}/background`, () => HttpResponse.json(body));

const era = backgroundItemDto({
  id: "00000000-0000-4000-8000-0000000000d2",
  topic: "era",
  claim: "1950년대 쿠바의 어촌.",
  source: { url: "https://bookanalysis.com/x", who: "해설 사이트" },
  quotes: [{ text: "쿠바의 작은 어촌이 배경이다", author: "external", lang: "ko", translationKo: null, translationAuthor: null, sourceKind: "editorial" }],
});

test("내 해석과 맞닿는 배경을 위에: 내 구절(나), 맞닿는 곳(AI), 배경 설명(AI), 인용과 옮김, 출처", async ({ worker }) => {
  worker.use(
    savedSession(),
    backgroundAnswer(
      backgroundViewDto({
        connected: [
          {
            item: backgroundItemDto(),
            connection: { myQuote: "꿈을 놓지 않는 이야기", myQuoteAuthor: "me", questionId: "about", note: "작가는 상징이 없다고 했다.", noteAuthor: "ai" },
          },
        ],
        others: [{ topic: "era", items: [era] }],
      }),
    ),
  );
  await renderWithProviders(<BackgroundView sessionId={SESSION_ID} />);

  const connected = page.getByRole("region", { name: "내 해석과 맞닿는 배경" });
  await expect.element(connected.getByText("내가 씀 · 이 책은 결국 무엇에 대한 이야기라고 읽었나요?")).toBeInTheDocument();
  await expect.element(connected.getByText("꿈을 놓지 않는 이야기")).toHaveClass(/text-ink-me/);
  await expect.element(connected.getByText("AI 가 씀 · 맞닿는 곳")).toBeInTheDocument();
  await expect.element(connected.getByText("작가는 상징이 없다고 했다.")).toHaveClass(/text-ink-ai/);
  await expect.element(connected.getByText("작가가 밝힌 의도")).toBeInTheDocument();
  await expect.element(connected.getByText("There isn't any symbolism. The sea is the sea.")).toHaveAttribute("lang", "en");
  await expect.element(connected.getByText("AI 가 옮김")).toBeInTheDocument();
  await expect.element(connected.getByText("상징은 없다. 바다는 바다다.")).toBeInTheDocument();
  await expect.element(connected.getByText(/기자, Mental Floss · 직접 한 말/)).toBeInTheDocument();
  await expect.element(connected.getByRole("link", { name: "mentalfloss.com" })).toHaveAttribute("href", "https://www.mentalfloss.com/article/64363");

  // 나머지는 접혀 있다
  const others = page.getByText("다른 배경 1개");
  await expect.element(others).toBeInTheDocument();
  await expect.element(page.getByText("1950년대 쿠바의 어촌.")).not.toBeVisible();
  await others.click();
  await expect.element(page.getByText("1950년대 쿠바의 어촌.")).toBeVisible();
  await expect.element(page.getByRole("region", { name: "시대와 사회" })).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "다른 시선 보기" })).toHaveAttribute("href", `/sessions/${SESSION_ID}/perspectives`);
});

test("맞닿는 배경을 찾지 못했으면 그렇게 알리고 나머지를 펼쳐 둔다", async ({ worker }) => {
  worker.use(savedSession(), backgroundAnswer(backgroundViewDto({ others: [{ topic: "era", items: [era] }] })));
  await renderWithProviders(<BackgroundView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("내 해석과 바로 맞닿는 배경은 찾지 못했어요. 모은 배경은 아래에 있어요.")).toBeInTheDocument();
  await expect.element(page.getByText("1950년대 쿠바의 어촌.")).toBeVisible();
});

test("모으는 중이면 알리고, 끝날 때까지 다시 읽는다", async ({ worker }) => {
  let calls = 0;
  worker.use(
    savedSession(),
    http.get(`/api/sessions/${SESSION_ID}/background`, () => {
      calls += 1;
      return HttpResponse.json(
        calls === 1
          ? backgroundViewDto({ collection: "collecting", connections: "waiting" })
          : backgroundViewDto({ connections: "making", others: [{ topic: "era", items: [era] }] }),
      );
    }),
  );
  await renderWithProviders(<BackgroundView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("자료를 모으는 중이에요")).toBeInTheDocument();
  await expect.element(page.getByText("내 해석과 맞닿는 배경을 찾는 중이에요."), { timeout: 8000 }).toBeInTheDocument();
  await expect.element(page.getByText("다른 배경 1개")).toBeInTheDocument();
});

test("수집이 실패했으면 확인하지 못함과 다시 모으기", async ({ worker }) => {
  let recollected = false;
  worker.use(
    savedSession(),
    http.get(`/api/sessions/${SESSION_ID}/background`, () =>
      HttpResponse.json(backgroundViewDto(recollected ? { collection: "collecting", connections: "waiting" } : { collection: "failed", connections: "waiting" })),
    ),
    http.post(`/api/sessions/${SESSION_ID}/background/recollect`, () => {
      recollected = true;
      return HttpResponse.json({ collection: "collecting" });
    }),
  );
  await renderWithProviders(<BackgroundView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("확인하지 못했어요")).toBeInTheDocument();
  await page.getByRole("button", { name: "다시 모으기" }).click();
  await expect.element(page.getByText("자료를 모으는 중이에요")).toBeInTheDocument();
  expect(recollected).toBe(true);
});

test("모았는데 보여 줄 배경이 없으면 확인하지 못함, 다시 모으기는 없다", async ({ worker }) => {
  worker.use(savedSession(), backgroundAnswer(backgroundViewDto()));
  await renderWithProviders(<BackgroundView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("출처의 문장으로 확인한 배경이 없어요.")).toBeInTheDocument();
  await expect.element(page.getByRole("button", { name: "다시 모으기" })).not.toBeInTheDocument();
});

test("내 해석 전이면 배경을 부르지 않고 내 해석 쓰기로 안내한다", async ({ worker }) => {
  let backgroundCalls = 0;
  worker.use(
    http.get(`/api/sessions/${SESSION_ID}`, () => HttpResponse.json(sessionViewDto())),
    http.get(`/api/sessions/${SESSION_ID}/background`, () => {
      backgroundCalls += 1;
      return HttpResponse.json(definedError("LOCKED", 403), { status: 403 });
    }),
  );
  await renderWithProviders(<BackgroundView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("내 해석을 먼저 써 주세요. 쓴 뒤에 배경을 볼 수 있어요.")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "내 해석 쓰기" })).toHaveAttribute("href", `/sessions/${SESSION_ID}/interpretation`);
  expect(backgroundCalls).toBe(0);
});
