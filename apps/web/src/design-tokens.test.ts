// DESIGN.md 가 디자인 값의 원본이다 (ADR-011). 화면의 토큰(globals.css)이 같은 이름, 같은 값인지 확인한다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const designMd = readFileSync(path.resolve(here, "../../../DESIGN.md"), "utf8");
const css = readFileSync(path.resolve(here, "app/globals.css"), "utf8");

type Typography = { fontFamily: string; fontSize: string; fontWeight: number; lineHeight: number; letterSpacing: string };
type Design = { colors: Record<string, string>; rounded: Record<string, string>; typography: Record<string, Typography> };

function frontMatter(md: string): Design {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("DESIGN.md 에 YAML 머리말이 없다");
  return parse(m[1]) as Design;
}

/** CSS 블록 하나(:root, @theme inline)의 사용자 정의 속성 */
function cssVars(block: "root" | "theme"): Map<string, string> {
  const start = block === "root" ? css.indexOf(":root {") : css.indexOf("@theme inline {");
  if (start < 0) throw new Error(`globals.css 에 ${block} 블록이 없다`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  const vars = new Map<string, string>();
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars.set(m[1], m[2].trim());
  return vars;
}

const design = frontMatter(designMd);
const root = cssVars("root");
const theme = cssVars("theme");
const norm = (v: string) => v.trim().toLowerCase();

describe("DESIGN.md ↔ globals.css", () => {
  it("DESIGN.md 의 색은 :root 에 같은 이름, 같은 값으로 있다", () => {
    for (const [name, value] of Object.entries(design.colors)) {
      expect({ name, value: norm(root.get(name) ?? "(없음)") }).toEqual({ name, value: norm(value) });
    }
  });

  it(":root 의 색은 모두 DESIGN.md 에 있다 (화면에만 있는 색이 없다)", () => {
    const colorVars = [...root.keys()].filter((k) => /^#|^rgb|^oklch/i.test(root.get(k) ?? ""));
    expect(colorVars.filter((k) => !(k in design.colors))).toEqual([]);
  });

  it("둥글기의 기준값이 같다", () => {
    expect(norm(root.get("radius") ?? "")).toBe(norm(design.rounded.md));
  });

  it("글자 단계는 Tailwind 테마에 같은 크기·행간·자간·굵기로 있다", () => {
    for (const [name, t] of Object.entries(design.typography)) {
      expect({
        name,
        size: theme.get(`text-${name}`),
        lineHeight: theme.get(`text-${name}--line-height`),
        letterSpacing: theme.get(`text-${name}--letter-spacing`),
        weight: theme.get(`text-${name}--font-weight`),
      }).toEqual({
        name,
        size: t.fontSize,
        lineHeight: String(t.lineHeight),
        letterSpacing: t.letterSpacing,
        weight: String(t.fontWeight),
      });
    }
  });
});
