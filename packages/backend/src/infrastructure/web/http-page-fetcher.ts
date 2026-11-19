// PageFetcher 를 HTTP 요청과 본문 추출로 구현한다 (ADR-004 §2 의 2단계, spec-01-03 가정 4).
// 주소는 LLM 이 낸 것이라 믿지 않는다: http(s) 만, 내부 주소는 막고, 넘겨주기도 한 번씩 확인한다.
// 접근 제한(로그인, 유료 벽, 차단)을 우회하지 않는다. 막히면 열지 못함으로 남긴다 (ADR-004 §8).
import { isIP } from "node:net";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { FetchedPage, PageFetcher } from "../../application/ports";

export type HttpPageFetcherOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  /** 시험용. 기본은 localhost 와 사설 IP 를 막는다 */
  allowPrivateHosts?: boolean;
};

const USER_AGENT = "Mozilla/5.0 (compatible; inkle-local/0.1; personal reading notes)";
const MAX_REDIRECTS = 5;

class Unreachable extends Error {}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  const kind = isIP(host);
  if (kind === 4) {
    const [a, b] = host.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (kind === 6) {
    return host === "::" || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80") || host.startsWith("::ffff:");
  }
  return false;
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

function charsetOf(contentType: string, head: Uint8Array): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  if (fromHeader) return fromHeader;
  const sniff = new TextDecoder("latin1").decode(head.slice(0, 2048));
  return /<meta[^>]+charset=["']?([\w-]+)/i.exec(sniff)?.[1] ?? "utf-8";
}

function decode(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export class HttpPageFetcher implements PageFetcher {
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly allowPrivateHosts: boolean;

  constructor(options: HttpPageFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
    this.allowPrivateHosts = options.allowPrivateHosts ?? false;
  }

  async fetch(url: string): Promise<FetchedPage> {
    try {
      const { finalUrl, html } = await this.download(url);
      return { status: "ok", finalUrl, ...extract(html) };
    } catch (e) {
      const reason =
        e instanceof Unreachable
          ? e.message
          : e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")
            ? `시간 초과 (${this.timeoutMs}ms)`
            : `요청 실패: ${e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e)}`;
      return { status: "unreachable", reason };
    }
  }

  private check(raw: string): URL {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      throw new Unreachable("주소 모양이 틀림");
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Unreachable(`http(s) 가 아님: ${u.protocol}`);
    if (!this.allowPrivateHosts && isPrivateHost(u.hostname)) throw new Unreachable(`내부 주소는 열지 않음: ${u.hostname}`);
    return u;
  }

  private async download(url: string): Promise<{ finalUrl: string; html: string }> {
    const signal = AbortSignal.timeout(this.timeoutMs);
    let current = this.check(url);
    for (let hop = 0; ; hop++) {
      const res = await fetch(current, {
        redirect: "manual",
        signal,
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.has("location")) {
        await res.body?.cancel();
        if (hop >= MAX_REDIRECTS) throw new Unreachable("넘겨주기가 너무 많음");
        current = this.check(new URL(res.headers.get("location")!, current).toString());
        continue;
      }
      if (!res.ok) {
        await res.body?.cancel();
        throw new Unreachable(`HTTP ${res.status}`);
      }
      const type = res.headers.get("content-type") ?? "";
      if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
        await res.body?.cancel();
        throw new Unreachable(`HTML 아님: ${type || "형식 없음"}`);
      }
      const bytes = await this.readLimited(res);
      return { finalUrl: current.toString(), html: decode(bytes, charsetOf(type, bytes)) };
    }
  }

  private async readLimited(res: Response): Promise<Uint8Array> {
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > this.maxBytes) {
      await res.body?.cancel();
      throw new Unreachable(`너무 큼 (${declared} 바이트)`);
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body!.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > this.maxBytes) {
        await reader.cancel();
        throw new Unreachable(`너무 큼 (${this.maxBytes} 바이트 넘음)`);
      }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return out;
  }
}

/** 페이지 전체 글자(스크립트·스타일 제외)와 기사 본문. 대조는 전체와, 읽기는 본문으로 한다. */
function extract(html: string): { pageText: string; articleText: string } {
  const { document } = parseHTML(html);
  for (const el of document.querySelectorAll("script,style,noscript,template")) el.remove();
  const pageText = collapse(document.body?.textContent || document.documentElement?.textContent || "");
  if (!pageText) throw new Unreachable("본문 없음");
  // Readability 는 문서를 바꾸므로 전체 글자를 먼저 뽑는다.
  let articleText = "";
  try {
    articleText = collapse(new Readability(document as unknown as ConstructorParameters<typeof Readability>[0], { charThreshold: 200 }).parse()?.textContent ?? "");
  } catch {
    articleText = "";
  }
  return { pageText, articleText: articleText || pageText };
}
