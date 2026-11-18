// 테스트 안에서 띄운 HTTP 서버로 시험한다. 바깥 웹에는 나가지 않는다.
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HttpPageFetcher } from "./http-page-fetcher";

const ARTICLE = `<!doctype html><html><head><title>인터뷰</title><script>var tracking = "스크립트 글자";</script>
<style>.x{color:red}</style></head><body>
<nav>메뉴 홈 뉴스 로그인</nav>
<article><h1>작가 인터뷰</h1>
<p>작가는 이렇게 말했다. “인간의 폭력에 대해 쓰고 싶었습니다.” 그것이 이 소설의 시작이었다.</p>
<p>그는 세 편의 이야기를 하나로 묶는 데 오래 걸렸다고 했다. 처음에는 단편 하나였다고 했다.</p>
<p>이 인터뷰는 서울에서 진행되었다. 질문과 답은 길게 이어졌고 우리는 오래 이야기했다.</p>
</article>
<footer>저작권 2024 신문사</footer></body></html>`;

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    switch (req.url) {
      case "/article":
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(ARTICLE);
        return;
      case "/redirect":
        res.writeHead(302, { location: "/article" }).end();
        return;
      case "/missing":
        res.writeHead(404, { "content-type": "text/html" }).end("<p>없음</p>");
        return;
      case "/json":
        res.writeHead(200, { "content-type": "application/json" }).end("{}");
        return;
      case "/big":
        res.writeHead(200, { "content-type": "text/html" });
        res.end(`<p>${"가".repeat(4000)}</p>`);
        return;
      case "/slow":
        setTimeout(() => res.writeHead(200, { "content-type": "text/html" }).end("<p>늦음</p>"), 2000);
        return;
      case "/euc-kr":
        res.writeHead(200, { "content-type": "text/html; charset=euc-kr" });
        // "안녕" 의 EUC-KR 바이트
        res.end(Buffer.concat([Buffer.from("<html><body><p>"), Buffer.from([0xbe, 0xc8, 0xb3, 0xe7]), Buffer.from("</p></body></html>")]));
        return;
      case "/empty":
        res.writeHead(200, { "content-type": "text/html" }).end("<html><body><script>x()</script></body></html>");
        return;
      case "/ua":
        res.writeHead(200, { "content-type": "text/html" }).end(`<p>${req.headers["user-agent"]}</p>`);
        return;
      default:
        res.writeHead(500).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

// 시험 서버가 127.0.0.1 에 있어 내부 주소를 허용한다. 기본값은 막는다 (아래 시험).
const fetcher = new HttpPageFetcher({ timeoutMs: 500, maxBytes: 8_000, allowPrivateHosts: true });

describe("HttpPageFetcher", () => {
  it("페이지 전체 글자와 기사 본문을 뽑는다. 스크립트·스타일은 뺀다", async () => {
    const page = await fetcher.fetch(`${base}/article`);
    expect(page.status).toBe("ok");
    if (page.status !== "ok") return;
    expect(page.finalUrl).toBe(`${base}/article`);
    expect(page.pageText).toContain("메뉴 홈 뉴스");
    expect(page.pageText).toContain("“인간의 폭력에 대해 쓰고 싶었습니다.”");
    expect(page.pageText).not.toContain("스크립트 글자");
    expect(page.pageText).not.toContain("color:red");
    expect(page.articleText).toContain("세 편의 이야기를 하나로 묶는 데");
    expect(page.articleText).not.toContain("저작권 2024");
    expect(page.pageText).not.toMatch(/\s{2,}/);
  });

  it("넘겨주기를 따라가고 마지막 주소를 남긴다", async () => {
    const page = await fetcher.fetch(`${base}/redirect`);
    expect(page).toMatchObject({ status: "ok", finalUrl: `${base}/article` });
  });

  it("글자 인코딩을 따른다 (EUC-KR)", async () => {
    const page = await fetcher.fetch(`${base}/euc-kr`);
    expect(page).toMatchObject({ status: "ok", pageText: "안녕" });
  });

  it("자기 이름을 밝히고 요청한다", async () => {
    const page = await fetcher.fetch(`${base}/ua`);
    expect(page.status === "ok" && page.pageText).toContain("inkle");
  });

  it.each([
    ["/missing", /HTTP 404/],
    ["/json", /HTML 아님/],
    ["/big", /너무 큼/],
    ["/slow", /시간 초과/],
    ["/empty", /본문 없음/],
  ])("%s 는 열지 못함", async (p, reason) => {
    const page = await fetcher.fetch(`${base}${p}`);
    expect(page.status).toBe("unreachable");
    if (page.status === "unreachable") expect(page.reason).toMatch(reason);
  });

  it("http(s) 가 아니거나 모양이 틀린 주소, 닫힌 포트는 열지 못함", async () => {
    expect((await fetcher.fetch("file:///etc/passwd")).status).toBe("unreachable");
    expect((await fetcher.fetch("아무 말")).status).toBe("unreachable");
    expect((await fetcher.fetch("http://127.0.0.1:1/")).status).toBe("unreachable");
  });

  it("기본값은 내부 주소(localhost, 사설 IP)를 열지 않는다", async () => {
    const strict = new HttpPageFetcher();
    for (const url of [`${base}/article`, "http://localhost/", "http://10.0.0.1/", "http://192.168.0.1/", "http://169.254.169.254/", "http://[::1]/"]) {
      const page = await strict.fetch(url);
      expect(page).toMatchObject({ status: "unreachable", reason: expect.stringMatching(/내부 주소/) });
    }
  });
});
