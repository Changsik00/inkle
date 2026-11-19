import { authorPerspectiveSchema, type AuthorPerspectiveDto, type PerspectivesViewDto } from "@inkle/contract/perspectives";
import { http, HttpResponse } from "msw";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { PerspectivesView } from "@/features/perspectives/perspectives-screen";
import {
  definedError,
  interpretationDto,
  otherPerspectiveDto,
  perspectivesViewDto,
  SESSION_ID,
  sessionViewDto,
} from "@/testing/fixtures";
import { renderWithProviders } from "@/testing/render";
import { test } from "@/testing/test";

const savedSession = () =>
  http.get(`/api/sessions/${SESSION_ID}`, () =>
    HttpResponse.json(sessionViewDto({ stage: "interpretation_saved", interpretation: interpretationDto() })),
  );

const answer = (body: PerspectivesViewDto) => http.get(`/api/sessions/${SESSION_ID}/perspectives`, () => HttpResponse.json(body));

const reader = otherPerspectiveDto({
  id: "00000000-0000-4000-8000-0000000000e2",
  who: "블로그 독자",
  role: "reader",
  reading: "돈을 얻지 못한 현실의 이야기로 읽는다.",
  prevalence: "rare",
  source: { url: "https://blog.example.com/1", who: "블로그 독자" },
  quotes: [{ text: "He came back with nothing to sell.", author: "external", lang: "en", translationKo: "그는 팔 것 없이 돌아왔다.", translationAuthor: "ai", sourceKind: "direct" }],
});

test("다른 사람의 읽기(흔한 정도·어떤 사람·AI 가 정리·인용), 작가 본인의 말(흔함 없음)", async ({ worker }) => {
  const author: AuthorPerspectiveDto = authorPerspectiveSchema.parse(
    otherPerspectiveDto({ id: "00000000-0000-4000-8000-0000000000e3", who: "헤밍웨이, 편지", reading: "상징을 넣지 않았다고 말했다." }),
  );
  worker.use(
    savedSession(),
    answer(perspectivesViewDto({ others: [otherPerspectiveDto(), reader, otherPerspectiveDto({ id: "00000000-0000-4000-8000-0000000000e4", who: "누군가", role: "other", prevalence: "unknown", reading: "다른 읽기." })], author: [author] })),
  );
  await renderWithProviders(<PerspectivesView sessionId={SESSION_ID} />);

  const others = page.getByRole("region", { name: "다른 사람의 읽기" });
  await expect.element(others.getByText("어느 읽기가 맞다는 뜻이 아니에요.", { exact: false })).toBeInTheDocument();
  await expect.element(others.getByText("평론가 김 · 평론가·기자 · 많이 나온 읽기")).toBeInTheDocument();
  await expect.element(others.getByText("블로그 독자 · 독자 · 드문 읽기")).toBeInTheDocument();
  // 알 수 없음은 표시하지 않는다
  await expect.element(others.getByText("누군가 · 그 밖", { exact: true })).toBeInTheDocument();
  await expect.element(others.getByText("노인의 패배를 정신의 승리로 읽는다.")).toHaveClass(/text-ink-ai/);
  await expect.element(others.getByText("AI 가 정리").first()).toBeInTheDocument();
  await expect.element(others.getByText("He came back with nothing to sell.")).toHaveAttribute("lang", "en");
  await expect.element(others.getByText("그는 팔 것 없이 돌아왔다.")).toBeInTheDocument();
  await expect.element(others.getByRole("link", { name: "blog.example.com" })).toHaveAttribute("href", "https://blog.example.com/1");

  const authorGroup = page.getByRole("region", { name: "작가 본인의 말" });
  await expect.element(authorGroup.getByText("헤밍웨이, 편지", { exact: true })).toBeInTheDocument();
  await expect.element(authorGroup.getByText("상징을 넣지 않았다고 말했다.")).toBeInTheDocument();
  await expect.element(page.getByRole("region", { name: "AI 가 만든 해석" })).not.toBeInTheDocument();
});

test("AI 가 만든 해석은 따로, 실제 사람의 글이 아니라고 알리고 인용 모양을 쓰지 않는다", async ({ worker }) => {
  worker.use(
    savedSession(),
    answer(perspectivesViewDto({ others: [reader], imagined: [{ id: "00000000-0000-4000-8000-0000000000e9", reading: "바다와 노인의 우정으로 읽을 수 있다.", readingAuthor: "ai" }] })),
  );
  await renderWithProviders(<PerspectivesView sessionId={SESSION_ID} />);
  const imagined = page.getByRole("region", { name: "AI 가 만든 해석" });
  await expect.element(imagined.getByText("실제 사람의 글이 아니에요. 찾은 시선이 적어 AI 가 만들었어요.")).toBeInTheDocument();
  await expect.element(imagined.getByText("AI 가 씀")).toBeInTheDocument();
  await expect.element(imagined.getByText("바다와 노인의 우정으로 읽을 수 있다.")).toHaveClass(/text-ink-ai/);
  expect(imagined.element().querySelector("blockquote")).toBeNull();
});

test("모으는 중이면 알리고, 끝날 때까지 다시 읽는다", async ({ worker }) => {
  let calls = 0;
  worker.use(
    savedSession(),
    http.get(`/api/sessions/${SESSION_ID}/perspectives`, () => {
      calls += 1;
      return HttpResponse.json(calls === 1 ? perspectivesViewDto({ collection: "collecting" }) : perspectivesViewDto({ others: [reader] }));
    }),
  );
  await renderWithProviders(<PerspectivesView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("자료를 모으는 중이에요")).toBeInTheDocument();
  await expect.element(page.getByText("블로그 독자 · 독자 · 드문 읽기"), { timeout: 8000 }).toBeInTheDocument();
});

test("수집이 실패했으면 확인하지 못함과 다시 모으기", async ({ worker }) => {
  let recollected = false;
  worker.use(
    savedSession(),
    http.get(`/api/sessions/${SESSION_ID}/perspectives`, () =>
      HttpResponse.json(perspectivesViewDto({ collection: recollected ? "collecting" : "failed" })),
    ),
    http.post(`/api/sessions/${SESSION_ID}/background/recollect`, () => {
      recollected = true;
      return HttpResponse.json({ collection: "collecting" });
    }),
  );
  await renderWithProviders(<PerspectivesView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("확인하지 못했어요")).toBeInTheDocument();
  await page.getByRole("button", { name: "다시 모으기" }).click();
  await expect.element(page.getByText("자료를 모으는 중이에요")).toBeInTheDocument();
  expect(recollected).toBe(true);
});

test("모았는데 보여 줄 시선이 없으면 확인하지 못함, 다시 모으기는 없다", async ({ worker }) => {
  worker.use(savedSession(), answer(perspectivesViewDto()));
  await renderWithProviders(<PerspectivesView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("출처의 문장으로 확인한 시선이 없어요.")).toBeInTheDocument();
  await expect.element(page.getByRole("button", { name: "다시 모으기" })).not.toBeInTheDocument();
});

test("내 해석 전이면 시선을 부르지 않고 내 해석 쓰기로 안내한다", async ({ worker }) => {
  let calls = 0;
  worker.use(
    http.get(`/api/sessions/${SESSION_ID}`, () => HttpResponse.json(sessionViewDto())),
    http.get(`/api/sessions/${SESSION_ID}/perspectives`, () => {
      calls += 1;
      return HttpResponse.json(definedError("LOCKED", 403), { status: 403 });
    }),
  );
  await renderWithProviders(<PerspectivesView sessionId={SESSION_ID} />);
  await expect.element(page.getByText("내 해석을 먼저 써 주세요. 쓴 뒤에 다른 시선을 볼 수 있어요.")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "내 해석 쓰기" })).toHaveAttribute("href", `/sessions/${SESSION_ID}/interpretation`);
  await expect.element(page.getByRole("link", { name: /← 배경/ })).toHaveAttribute("href", `/sessions/${SESSION_ID}/background`);
  expect(calls).toBe(0);
});
