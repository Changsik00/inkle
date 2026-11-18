// 테스트용 PageFetcher. 주소별로 정해 둔 페이지를 돌려준다. 없는 주소는 열지 못함.
import type { FetchedPage, PageFetcher } from "../../application/ports";

export class FakePageFetcher implements PageFetcher {
  readonly requested: string[] = [];

  constructor(private readonly pages: Record<string, FetchedPage | Error>) {}

  async fetch(url: string): Promise<FetchedPage> {
    this.requested.push(url);
    const page = Object.hasOwn(this.pages, url) ? this.pages[url] : undefined;
    if (page instanceof Error) throw page;
    return page ?? { status: "unreachable", reason: "HTTP 404" };
  }

  static page(text: string, finalUrl = "https://example.com/final"): FetchedPage {
    return { status: "ok", finalUrl, pageText: `메뉴 로그인 ${text} 댓글 저작권`, articleText: text };
  }
}
