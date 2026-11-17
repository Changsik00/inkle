// ADR-004 가정 4 확인: 출처 페이지의 본문을 HTTP 요청으로 글자로 뽑을 수 있는가.
// 일회성 스크립트. 제품 코드는 이 파일을 쓰지 않는다.
// 실행: pnpm tsx scripts/spike/fetch-text.mts
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

type Target = { lang: "ko" | "en"; url: string; expect: string[] };

// spec-01-01 리허설에서 사람이 열어 확인한 출처와, 그 글에 있다고 기록한 낱말.
const targets: Target[] = [
  { lang: "ko", url: "https://newstomato.com/ReadNews.aspx?no=657317", expect: ["불편", "질문"] },
  { lang: "ko", url: "https://m.seoul.co.kr/news/2024/12/07/20241207500003", expect: ["채식주의자", "명명"] },
  { lang: "ko", url: "https://weekly.khan.co.kr/article/202410210600061", expect: ["폭력", "채식"] },
  { lang: "ko", url: "https://peoplepower21.org/magazine/1981453", expect: ["주체성", "식물"] },
  { lang: "ko", url: "https://v.daum.net/v/20241023110154946", expect: ["극단적", "폭력"] },
  { lang: "en", url: "https://nybooks.com/articles/2016/08/18/han-kang-vegetarian-crazy-in-korea", expect: ["Vegetarian", "Han Kang"] },
  { lang: "en", url: "https://www.newstatesman.com/culture/2015/02/han-kangs-vegetarian-failures-language-and-mysteries-physical", expect: ["Han Kang", "Vegetarian"] },
  { lang: "en", url: "https://en.wikipedia.org/wiki/The_Old_Man_and_the_Sea", expect: ["marlin", "Santiago"] },
  { lang: "en", url: "https://www.nobelprize.org/prizes/literature/1954/summary/", expect: ["Hemingway", "The Old Man and the Sea"] },
];

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

async function check(t: Target) {
  const started = Date.now();
  try {
    const res = await fetch(t.url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; inkle-local/0.1)", accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    const html = await res.text();
    const { document } = parseHTML(html);
    for (const el of document.querySelectorAll("script,style,noscript,template")) el.remove();
    const whole = normalize(document.body?.textContent ?? "");
    const article = normalize(new Readability(document as unknown as Document).parse()?.textContent ?? "");
    const found = (text: string) => t.expect.filter((w) => text.includes(w)).length;
    return {
      lang: t.lang,
      host: new URL(t.url).host,
      status: res.status,
      ms: Date.now() - started,
      wholeChars: whole.length,
      articleChars: article.length,
      foundInWhole: `${found(whole)}/${t.expect.length}`,
      foundInArticle: `${found(article)}/${t.expect.length}`,
    };
  } catch (e) {
    return { lang: t.lang, host: new URL(t.url).host, status: "error", ms: Date.now() - started, error: String(e).slice(0, 80) };
  }
}

const rows = [];
for (const t of targets) rows.push(await check(t));
console.table(rows);
