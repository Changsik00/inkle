import { afterEach, expect } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { useDraft } from "@/features/writing/use-draft";
import { test } from "@/testing/test";

const KEY = "inkle:test:draft";

function Probe({ initial = "" }: { initial?: string }) {
  const draft = useDraft(KEY, initial);
  return (
    <div>
      <label htmlFor="draft-probe">글</label>
      <textarea id="draft-probe" value={draft.value} onChange={(e) => draft.setValue(e.target.value)} />
      <p>{draft.dirty ? "바뀜" : "그대로"}</p>
      <button type="button" onClick={draft.clear}>
        지우기
      </button>
    </div>
  );
}

afterEach(() => localStorage.clear());

test("쓰는 글을 브라우저에 임시 저장하고, 다시 열면 되살린다", async () => {
  const first = await render(<Probe />);
  await page.getByLabelText("글").fill("노인과 바다");
  await expect.element(page.getByText("바뀜")).toBeInTheDocument();
  await first.unmount();

  await render(<Probe />);
  await expect.element(page.getByLabelText("글")).toHaveValue("노인과 바다");
});

test("지우면 임시본도 사라지고 처음 값으로 돌아간다", async () => {
  const first = await render(<Probe initial="처음" />);
  await page.getByLabelText("글").fill("바꾼 글");
  await page.getByRole("button", { name: "지우기" }).click();
  await expect.element(page.getByLabelText("글")).toHaveValue("처음");
  await first.unmount();
  expect(localStorage.getItem(KEY)).toBeNull();
});

test("바뀐 글이 있으면 떠날 때 묻는다 (beforeunload)", async () => {
  await render(<Probe />);
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);

  await page.getByLabelText("글").fill("저장 안 한 글");
  const dirty = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
});
