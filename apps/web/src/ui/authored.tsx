import type * as React from "react"
import { cn } from "cn"

// 글쓴이 표시 (DESIGN.md §Components text-me / text-ai / quote-block, ADR-002 §3).
// 내 글·AI 글·바깥 사람의 인용을 잉크 색과 글꼴로 나누고, 색만이 아니라 글자 표시("내가 씀")도 붙인다.

const MARK = { me: "내가 씀", ai: "AI 가 씀" } as const

/** 글 묶음 위에 붙는 작은 표시. label 로 "AI 가 옮김"처럼 바꿀 수 있다 */
function AuthorMark({ by, label, className }: { by: "me" | "ai"; label?: string; className?: string }) {
  return (
    <p data-slot="author-mark" data-author={by} className={cn("text-caption text-muted-foreground", className)}>
      {label ?? MARK[by]}
    </p>
  )
}

/** 독자가 쓴 글 (만년필 파랑, body-reading) */
function MyText({ children, label, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div data-slot="my-text" className="flex flex-col gap-1" {...props}>
      <AuthorMark by="me" label={label} />
      <div className="text-body-reading whitespace-pre-line text-ink-me">{children}</div>
    </div>
  )
}

/** AI 가 쓴 글 (흑연 회색, body-md) */
function AiText({ children, label, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div data-slot="ai-text" className="flex flex-col gap-1" {...props}>
      <AuthorMark by="ai" label={label} />
      <div className="text-body-md text-ink-ai">{children}</div>
    </div>
  )
}

/**
 * 바깥 사람의 인용 (명조, 왼쪽 2px 선). 아래에 누가 어디서 한 말인지.
 * 한국어가 아니면 옮김을 AI 글로 함께 보여 준다.
 */
function ExternalQuote({
  text,
  lang,
  cite,
  translation,
}: {
  text: string
  lang: string
  /** 누가·어디서 (caption 줄) */
  cite: React.ReactNode
  translation?: string | null
}) {
  return (
    <figure data-slot="external-quote" className="flex flex-col gap-2 border-l-2 border-rule-strong pl-4">
      <blockquote lang={lang} className="font-serif text-quote text-ink-quote">
        {text}
      </blockquote>
      {translation && <AiText label="AI 가 옮김">{translation}</AiText>}
      <figcaption className="text-caption text-muted-foreground">{cite}</figcaption>
    </figure>
  )
}

export { AiText, AuthorMark, ExternalQuote, MyText }
