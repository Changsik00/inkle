---
version: alpha
name: inkle — 여백의 노트
description: 책을 읽은 뒤 여백에 연필로 적는 느낌. 차가운 흰 종이, 잉크 글자, 선 하나로 대신하는 장식.
colors:
  background: "#F7F8F8"
  foreground: "#1D1F22"
  card: "#F7F8F8"
  card-foreground: "#1D1F22"
  popover: "#FFFFFF"
  popover-foreground: "#1D1F22"
  primary: "#1D1F22"
  primary-foreground: "#F7F8F8"
  secondary: "#EEF0F1"
  secondary-foreground: "#1D1F22"
  muted: "#EEF0F1"
  muted-foreground: "#5F6670"
  accent: "#EEF0F1"
  accent-foreground: "#1D1F22"
  destructive: "#A33A2B"
  border: "#D9DCDF"
  input: "#C4C9CE"
  ring: "#7A8390"
  rule-strong: "#9AA1A9"
  ink-me: "#1F3A93"
  ink-ai: "#5B6168"
  ink-quote: "#1D1F22"
typography:
  display:
    fontFamily: Gowun Batang
    fontSize: 2rem
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: -0.01em
  heading-1:
    fontFamily: system-ui
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  heading-2:
    fontFamily: system-ui
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0em
  title-book:
    fontFamily: Gowun Batang
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
  body-reading:
    fontFamily: system-ui
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: 0em
  quote:
    fontFamily: Gowun Batang
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: 0em
  body-md:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0em
  body-sm:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  label:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  caption:
    fontFamily: system-ui
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
rounded:
  none: 0px
  sm: 2px
  md: 4px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
  measure: 42rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 10px
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 10px
  input:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 8px
  book-row:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.title-book}"
    padding: 16px
  book-row-meta:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
  quote-block:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink-quote}"
    typography: "{typography.quote}"
    padding: 16px
  text-me:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink-me}"
    typography: "{typography.body-reading}"
  text-ai:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink-ai}"
    typography: "{typography.body-md}"
  error-text:
    backgroundColor: "{colors.background}"
    textColor: "{colors.destructive}"
    typography: "{typography.body-sm}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 10px
  row-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  muted-panel:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
    padding: 12px
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    padding: 16px
  menu:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.sm}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  input-outline:
    backgroundColor: "{colors.input}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.ring}"
    height: 2px
  quote-rule:
    backgroundColor: "{colors.rule-strong}"
    width: 2px
---

# inkle 디자인 — 여백의 노트

이 파일이 inkle 화면의 디자인 값과 규칙의 원본이다 (ADR-011). 화면의 토큰(`apps/web/src/app/globals.css`)은 이 파일의 값을 그대로 옮기고, 테스트(`apps/web/src/design-tokens.test.ts`)가 두 파일이 같은지 확인한다. 사람과 AI 에이전트 모두 화면을 만들거나 고칠 때 이 파일을 먼저 읽는다.

## Overview

inkle 은 책을 읽은 뒤 내 해석을 먼저 쓰고, 그 해석을 작품의 배경과 다른 사람들의 실제 시선에 비춰 보는 곳이다. 화면은 **책의 여백에 연필로 적는 느낌**이어야 한다.

- **조용하다.** 화면이 말을 걸지 않는다. 장식은 선 하나로 대신하고, 강조는 굵기와 크기로 한다.
- **글이 주인공이다.** 독자의 글과 책의 문장이 가장 잘 보여야 한다. 버튼과 표시는 뒤로 물러난다.
- **누가 쓴 글인지 한눈에 보인다.** 내 글, AI 가 쓴 글, 외부 사람의 인용은 잉크 색과 글꼴로 구분한다 (원칙 "내 글과 AI 글을 섞지 않는다").
- **채점하지 않는다.** AI 는 독자를 평가하지 않는다. 독자의 글에 빨간 펜처럼 보이는 표시를 하지 않는다.
- **AI 가 만든 화면처럼 보이지 않는다.** 흔한 기본값을 피한다 (§Do's and Don'ts).

## Colors

차가운 흰 종이 위의 잉크. 색은 거의 쓰지 않고, 쓰는 색에는 뜻이 있다.

- **종이 (`background` #F7F8F8):** 크림이 아닌 차가운 흰색. 모든 화면의 바탕.
- **잉크 (`foreground` #1D1F22):** 본문과 제목. 주 행동 버튼(`primary`)도 같은 잉크다.
- **옅은 면 (`muted`, `secondary`, `accent` #EEF0F1):** 눌린 상태, 옅은 바탕. 넓게 깔지 않는다.
- **보조 글자 (`muted-foreground` #5F6670):** 작가, 장르, 날짜, 도움말.
- **선 (`border` #D9DCDF, `input` #C4C9CE, `rule-strong` #9AA1A9):** 목록 구분, 입력란 테두리, 인용의 왼쪽 선.
- **초점 (`ring` #7A8390):** 키보드 초점 표시.
- **내 글 (`ink-me` #1F3A93):** 만년필 파랑. **독자가 쓴 글에만** 쓴다. 버튼이나 링크에 쓰지 않는다.
- **AI 글 (`ink-ai` #5B6168):** 흑연 회색. AI 가 정리하거나 만든 글.
- **외부 인용 (`ink-quote` #1D1F22):** 잉크 그대로, 명조와 왼쪽 선으로 구분한다.
- **오류 (`destructive` #A33A2B):** 시스템 오류와 입력 검사에만. 독자의 해석이나 노트에는 절대 쓰지 않는다.

`popover` 는 떠 있는 메뉴의 바탕으로 종이보다 한 단계 밝은 흰색(#FFFFFF)이다. 입력란 바탕에도 쓴다.

## Typography

고딕은 화면의 글자, 명조는 책의 목소리다. 명조는 책 제목, 외부 인용, 책 정보의 큰 제목에만 쓴다.

- **고딕 (`system-ui`):** 화면 글자 전부. 운영체제의 한국어 고딕을 쓴다 (Mac: Apple SD Gothic Neo, Windows: 맑은 고딕). 내려받는 글꼴이 없다. 배포할 때 운영체제마다 모양을 맞출 필요가 생기면 Pretendard 를 다시 본다.
- **명조 (`Gowun Batang`, 고운바탕):** 책 제목, 인용, 책 정보의 큰 제목. 가늘고 부드러운 획이 연필로 적는 느낌에 맞는다. 굵기는 400 하나만 쓴다 (700 은 쓰지 않는다). 견본에서 고른 글꼴이다 (spec-01-06, 후보: Noto Serif KR, 함렛).
- **한국어 조판:**
  - 자간은 0 이 기본이다. 큰 명조 제목(`display`)에만 -0.01em.
  - 본문 행간은 1.75 (긴 글과 인용은 1.8). 제목은 1.25–1.4.
  - 줄바꿈은 어절 단위 (`word-break: keep-all`), 넘칠 때만 글자 단위 (`overflow-wrap: break-word`).
  - 제목은 `text-wrap: balance`, 본문은 `text-wrap: pretty`.
- **굵기:** 고딕은 400, 500, 600. 명조는 400. 700 이상은 쓰지 않는다.

| 단계 | 쓰임 |
|---|---|
| `display` | 책 정보 화면의 책 제목 |
| `heading-1` | 화면 제목 |
| `heading-2` | 절 제목 |
| `title-book` | 목록의 책 제목 |
| `body-reading` | 독자가 쓴 긴 글 |
| `quote` | 외부 사람의 인용 |
| `body-md` | 기본 본문 |
| `body-sm` | 보조 글, 오류 문장 |
| `label` | 버튼, 입력란 이름 |
| `caption` | 작가·장르, 날짜 |

## Layout

- **한 단, 왼쪽 정렬.** 본문 너비는 최대 `measure` (42rem, 16px 기준 약 40자). 가운데 정렬 히어로를 두지 않는다.
- **간격은 4px 단위** (`spacing`). 절 사이는 `2xl`(32px) 이상, 같은 묶음 안은 `sm`–`lg`.
- **목록은 행이다.** 카드 격자가 아니라 가는 선으로 나눈 행을 위에서 아래로 놓는다.
- 화면 위쪽에 제품 이름을 크게 걸지 않는다. 제품 이름은 작게, 화면 제목이 먼저 보이게 한다.

## Elevation & Depth

그림자를 쓰지 않는다. 층은 1px 선(`border`)과 옅은 면(`muted`)으로만 나눈다. 떠 있는 메뉴(드롭다운 등)도 선으로 경계를 짓고, 그림자가 꼭 필요하면 이 파일에 먼저 토큰을 더한다.

## Shapes

- 둥글기는 작다: 입력란 `sm`(2px), 버튼 `md`(4px). 알약 모양(`full`)은 동그란 아바타 같은 원형에만.
- 외부 인용은 왼쪽에 2px 선(`rule-strong`)을 두고, 상자로 감싸지 않는다.

## Components

- **주 버튼 (`button-primary`):** 잉크 검정 바탕, 종이색 글자. 한 화면에 하나.
- **보조 버튼 (`button-outline`):** 종이 바탕, 1px 선.
- **입력란 (`input`):** 흰 바탕, 1px `input` 선, 둥글기 `sm`. 오류일 때는 선과 아래 문장만 `destructive`.
- **책 행 (`book-row`, `book-row-meta`):** 책 제목은 명조(`title-book`), 아래 줄에 작가 · 장르(`caption`, 보조 글자). 행 사이에 1px 선. 그림자와 카드 테두리 없음.
- **인용 (`quote-block`, `quote-rule`):** 명조, 왼쪽 2px 선(`rule-strong`), 아래에 누가 어디서 한 말인지 (`caption`).
- **내 글 (`text-me`), AI 글 (`text-ai`):** 글 묶음 위에 "내가 씀" / "AI 가 씀" 표시를 붙인다 (컴포넌트는 spec-01-10 에서 만든다).
- **오류 문장 (`error-text`):** 입력란 아래, `body-sm`.
- **보조 버튼 (`button-secondary`), 행 위에 올렸을 때 (`row-hover`), 옅은 안내 상자 (`muted-panel`), 평평한 면 (`panel`), 떠 있는 메뉴 (`menu`):** shadcn/ui 부품이 쓰는 면. 그림자 없이 선과 면으로만.
- **선 (`divider`, `input-outline`, `focus-ring`):** 목록 구분선 1px, 입력란 테두리 1px, 키보드 초점 2px.

## Do's and Don'ts

**Do**

- 토큰 이름(`bg-background`, `text-muted-foreground`, `text-title-book` …)만 쓴다.
- 강조는 굵기(500/600)와 크기로 한다.
- 글쓴이를 잉크 색과 글꼴로 구분한다. 색만으로 구분하지 말고 "내가 씀"처럼 글자 표시도 붙인다.
- 문구는 해요체로 짧고 담백하게. "아직 등록한 책이 없어요"처럼 사실만 말한다.
- 빈 상태는 다음 행동 하나만 보여 준다.

**Don't (흔한 AI 기본값)**

- 보라·남색 그라데이션, 그라데이션 글자.
- 그림자로 떠 있는 카드, 유리 효과(glassmorphism).
- 가운데 정렬 히어로 + 카드 세 개 격자.
- 제목의 이모지, 반짝이(✨) 같은 "AI 기능" 아이콘.
- 크림·베이지 바탕 + 주황·코랄 강조 + 큰 이탤릭 세리프 제목 (2026년에 흔해진 새 기본값).
- 알약 모양 버튼, 지나치게 둥근 모서리.
- "당신의 독서 여정을 새롭게" 같은 과장 문구, 느낌표.

**Don't (이 제품의 원칙)**

- 독자의 글에 빨간색, 줄긋기, 점수, 등급처럼 채점으로 보이는 표시.
- 내 글과 AI 글을 같은 색, 같은 글꼴로 섞어 보여 주기.
- 화면 코드에 16진수 색이나 눈금 밖 값(`rounded-[13px]`)을 직접 쓰기 (`@shadcn/lint` 가 막는다).

## Responsive Behavior

- 한 단 배치라 화면 폭이 줄어도 구조는 같다. 좌우 여백만 줄인다 (모바일 16px).
- 640px 아래에서 `display` 는 1.625rem(26px)으로 줄인다. 다른 단계는 그대로.
- 누를 수 있는 것은 높이 40px 이상.

## Iteration Guide

AI 에이전트와 사람이 화면을 만들거나 고칠 때 따른다.

1. 이 파일을 먼저 읽는다. 여기에 없는 값이 필요하면 화면 코드가 아니라 이 파일에 토큰을 먼저 더하고, `globals.css` 에 같은 값을 옮긴다.
2. 화면 코드에는 토큰 이름만 쓴다. 16진수 색, 눈금 밖 값, 인라인 스타일을 쓰지 않는다.
3. 한 번에 부품 하나씩 고친다. 공통 부품은 `apps/web/src/ui/` 에서만 겉모양을 정한다.
4. 고친 뒤 `pnpm lint` (ESLint, `@shadcn/lint`, 이 파일의 형식 검사)와 `pnpm test` (토큰 동기화 테스트 포함)를 돌린다.
5. §Do's and Don'ts 의 목록과 화면을 대조한다.

## Known Gaps

- **다크 모드:** 아직 없다. 같은 토큰 이름에 다른 값을 주는 묶음(`.dark`)으로 더한다.
- **움직임:** 정하지 않았다. 쓴다면 150–200ms, 화면 전환 없이 상태 변화에만.
- **글쓴이 표시 컴포넌트:** 토큰과 규칙만 있다. 컴포넌트는 spec-01-10.
