import { http, HttpResponse } from "msw";
import { afterEach, expect } from "vitest";
import { page } from "vitest/browser";
import { InterpretationForm } from "@/features/sessions/interpretation-form";
import { definedError, interpretationDto, SESSION_ID, sessionViewDto } from "@/testing/fixtures";
import { renderWithProviders } from "@/testing/render";
import { test } from "@/testing/test";

afterEach(() => localStorage.clear());

const save = page.getByRole("button", { name: "저장" });

test("질문 넷을 입력란과 함께 보여 준다", async () => {
  await renderWithProviders(<InterpretationForm view={sessionViewDto()} />);
  await expect.element(page.getByLabelText("이 책은 결국 무엇에 대한 이야기라고 읽었나요?")).toBeInTheDocument();
  await expect.element(page.getByLabelText("작가는 왜 이렇게 썼다고 생각하나요?")).toBeInTheDocument();
  await expect.element(page.getByText("결말, 인물, 형식 중 하나를 골라서")).toBeInTheDocument();
});

test("아무것도 쓰지 않고 저장하면 서버에 보내지 않고 이유를 보여 준다", async ({ worker }) => {
  let calls = 0;
  worker.use(http.put(`/api/sessions/${SESSION_ID}/interpretation`, () => void (calls += 1)));
  await renderWithProviders(<InterpretationForm view={sessionViewDto()} />);
  await save.click();
  await expect.element(page.getByText("적어도 한 질문에 답해 주세요")).toBeInTheDocument();
  expect(calls).toBe(0);
});

test("저장하면 쓴 답을 보내고, 저장했다고 알린 뒤 읽기 모드로 보여 준다", async ({ worker }) => {
  let body: unknown;
  worker.use(
    http.put(`/api/sessions/${SESSION_ID}/interpretation`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(interpretationDto({ answers: [{ questionId: "lingering", text: "상어 장면" }] }));
    }),
    http.get(`/api/sessions/${SESSION_ID}`, () =>
      HttpResponse.json(sessionViewDto({ stage: "interpretation_saved", interpretation: interpretationDto({ answers: [{ questionId: "lingering", text: "상어 장면" }] }) })),
    ),
  );
  await renderWithProviders(<InterpretationForm view={sessionViewDto()} />);
  await page.getByLabelText("가장 오래 남은 장면이나 문장은 무엇이고, 왜 남았나요?").fill("상어 장면");
  await expect.element(page.getByText("5자")).toBeInTheDocument();
  await save.click();
  await expect.element(page.getByText("저장했어요")).toBeInTheDocument();
  await expect.element(page.getByText("상어 장면")).toBeInTheDocument();
  await expect.element(page.getByText(/^내가 씀 · 판 1/)).toBeInTheDocument();
  expect(body).toEqual({ answers: [{ questionId: "lingering", text: "상어 장면" }] });
  expect(localStorage.length).toBe(0);
});

test("저장한 해석은 읽기 모드로 보이고 배경 보기로 이어진다. 고쳐 쓰기를 누르면 그 글로 입력란이 채워진다", async () => {
  const view = sessionViewDto({ stage: "interpretation_saved", interpretation: interpretationDto() });
  await renderWithProviders(<InterpretationForm view={view} />);
  await expect.element(page.getByText("꿈을 놓지 않는 이야기")).toBeInTheDocument();
  await expect.element(page.getByRole("link", { name: "배경 보기" })).toHaveAttribute("href", `/sessions/${SESSION_ID}/background`);
  await page.getByRole("button", { name: "고쳐 쓰기" }).click();
  await expect.element(page.getByLabelText("이 책은 결국 무엇에 대한 이야기라고 읽었나요?")).toHaveValue("꿈을 놓지 않는 이야기");
});

test("서버가 규칙 위반을 알리면 그 이유를, 그 밖의 오류면 다시 시도하라고 알린다", async ({ worker }) => {
  worker.use(
    http.put(`/api/sessions/${SESSION_ID}/interpretation`, () =>
      HttpResponse.json(definedError("INVALID_INTERPRETATION", 400, { violations: [{ reason: "too_long", questionId: "about", max: 4000 }] }), { status: 400 }),
    ),
  );
  await renderWithProviders(<InterpretationForm view={sessionViewDto()} />);
  await page.getByLabelText("이 책은 결국 무엇에 대한 이야기라고 읽었나요?").fill("길다");
  await save.click();
  await expect.element(page.getByText("4000자까지 쓸 수 있어요")).toBeInTheDocument();

  worker.use(http.put(`/api/sessions/${SESSION_ID}/interpretation`, () => new HttpResponse(null, { status: 500 })));
  await save.click();
  await expect.element(page.getByText("저장하지 못했어요. 쓴 글은 이 브라우저에 남아 있어요. 잠시 뒤 다시 시도해 주세요.")).toBeInTheDocument();
});
