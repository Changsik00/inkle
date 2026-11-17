import { http, HttpResponse } from "msw";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { HealthStatus } from "@/features/system/health-status";
import { renderWithProviders } from "@/testing/browser/render";
import { test } from "@/testing/browser/test";

test("DB 에 닿으면 연결됨을 보여준다", async ({ worker }) => {
  worker.use(http.get("/api/health", () => HttpResponse.json({ db: "ok" })));
  await renderWithProviders(<HealthStatus />);
  await expect.element(page.getByText("DB 연결됨")).toBeInTheDocument();
});

test("DB 에 닿지 못하면 그렇게 보여준다", async ({ worker }) => {
  worker.use(
    http.get("/api/health", () =>
      HttpResponse.json({ defined: true, code: "SERVICE_UNAVAILABLE", status: 503, message: "x" }, { status: 503 }),
    ),
  );
  await renderWithProviders(<HealthStatus />);
  await expect.element(page.getByText("DB 에 닿지 못함")).toBeInTheDocument();
});
