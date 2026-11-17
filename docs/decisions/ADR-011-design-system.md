---
id: ADR-011
type: convention
date: 2026-11-18
status: accepted
---

# ADR-011: 디자인 규칙은 DESIGN.md 가 원본이고, 화면 토큰은 그 값을 그대로 따른다 (여백의 노트)

## 📚 Context

- 화면은 shadcn/ui 기본 테마 그대로라 "AI 가 만든 화면"처럼 보였다. 사용자가 이를 피하고 싶어 했다 (2026-11-17).
- 디자인 규칙이 문서로 없어 사람과 AI 에이전트가 화면마다 다르게 판단했다.
- Google Labs 가 2026년 4월 에이전트용 디자인 문서 형식(DESIGN.md, alpha)과 형식 검사 도구(`@google/design.md`)를 공개했다. 실제 브랜드의 DESIGN.md 모음(VoltAgent/awesome-design-md)도 있다.
- ADR-007 §4 가 "테마는 `globals.css` 의 토큰 한곳에서 바꾼다"를 정했지만, 그 값과 방향은 정하지 않았다.

## 🎯 Decision

1. **방향은 "여백의 노트"** (사용자 선택): 차가운 흰 종이, 잉크 글자, 명조는 책 제목과 인용에만, 카드와 그림자 대신 가는 선, 작은 둥글기, 왼쪽 정렬의 한 단. 글쓴이는 잉크 색으로 구분한다 (내 글 만년필 파랑, AI 글 흑연 회색, 외부 인용 명조와 왼쪽 선). 독자의 글에 빨간색을 쓰지 않는다.
2. **저장소 루트의 `DESIGN.md` 가 원본**이다. 머리말에 토큰(색, 글자 단계, 둥글기, 간격, 부품), 본문에 Google 형식의 여덟 절과 Responsive Behavior, Iteration Guide(에이전트 작업 규칙), Known Gaps 를 둔다.
3. **`apps/web/src/app/globals.css` 는 그 값을 그대로 옮긴다.** `apps/web/src/design-tokens.test.ts` 가 색, 기준 둥글기, 글자 단계(크기·행간·자간·굵기)가 같은지 비교한다. 화면에만 있는 색도 실패로 본다.
4. **검사**: `pnpm lint` 가 `design.md lint DESIGN.md` 를 함께 돈다 (형식, 깨진 참조, WCAG 대비).
5. **글꼴**: 명조는 고운바탕(`next/font/google`, 자체 호스팅, 굵기 400), 고딕은 운영체제 글꼴. 견본에서 사용자가 골랐다 (후보: Noto Serif KR, 함렛, Pretendard).
6. **한국어 조판**: 본문 자간 0, 행간 1.75, `word-break: keep-all` + `overflow-wrap: break-word`, 제목 `text-wrap: balance`, 본문 `text-wrap: pretty`.
7. **에이전트 규칙**: `CLAUDE.md` 에 "화면 작업 때 DESIGN.md 를 따른다"를 둔다.

## 📊 Consequences

- **긍정**: 사람과 에이전트가 같은 문서를 보고, 값은 테스트와 lint 가 지킨다.
- **긍정**: 흔한 AI 기본값을 금지 목록으로 적어 두어, 새 화면이 같은 기본값으로 돌아가는 것을 막는다.
- **부정**: 값을 바꿀 때 두 파일을 함께 고쳐야 한다 (테스트가 어긋남을 잡는다).
- **부정**: DESIGN.md 형식이 alpha 라 바뀔 수 있다.
- **부정**: 고운바탕은 굵기가 400/700 뿐이라 명조의 강약은 크기로만 준다.
- **중립**: 다크 모드는 아직 없다.

## 🔀 Alternatives

- **`globals.css` 를 원본으로**: 파일이 하나다 — 비채택 이유: 사람과 에이전트가 읽을 규칙(왜, 언제)이 남지 않고, 형식·대비 검사를 쓸 수 없다.
- **DESIGN.md 에서 CSS 를 생성** (`design.md export`): 손으로 옮기지 않는다 — 비채택 이유: shadcn/ui 가 기대하는 변수 구조와 Tailwind `@theme` 연결을 생성물에 맞추기 어렵다. 비교 테스트가 더 단순하다.
- **모음의 브랜드 파일을 그대로 쓰기**: 바로 쓸 수 있다 — 비채택 이유: 남의 브랜드를 흉내 내게 된다. 구성과 표기법만 참고했다.
- **다른 방향** (도서관 카드, 잡지 편집): 비채택 이유: 사용자 선택.

## 📌 Status

Accepted (2026-11-18, spec-01-06).

## 🔗 Related

- `DESIGN.md`, ADR-007 §4
- 참고: google-labs-code/design.md, VoltAgent/awesome-design-md
