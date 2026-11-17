# spec-01-06: 디자인 시스템 (DESIGN.md, 여백의 노트)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-01-06` |
| **Phase** | `phase-01` |
| **Branch** | `spec-01-06-design-system` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-11-18 |
| **소유자** | Changsik00 |

## 배경 및 문제 정의

### 현재 상황

화면은 shadcn/ui 기본 토큰(중립 회색, OKLCH)과 기본 부품(그림자 있는 카드, 둥근 버튼) 그대로다. 토큰을 한곳(`apps/web/src/app/globals.css`)에서 바꾸는 구조와 이를 강제하는 lint(ADR-007 §4)는 있지만, 값과 방향은 정하지 않았다.

### 문제점

- 기본값 그대로라 "AI 가 만든 화면"처럼 보인다. 사용자가 이를 피하고 싶어 했다 (2026-11-17).
- 디자인 규칙이 문서로 없어, 사람이든 AI 에이전트든 화면을 만들 때마다 다르게 판단한다.
- 이후 화면(내 해석 쓰기, 배경, 시선, 비교)은 글쓴이 구분(나 / AI / 외부 사람)을 화면에서 보여줘야 하는데 (ADR-007 §5), 그 시각 언어가 없다.

### 해결 방안

Google Labs 의 DESIGN.md 형식으로 디자인 규칙을 저장소 루트에 쓰고, 그 값을 화면의 토큰에 그대로 옮긴다. 두 파일의 값이 같은지 테스트로 확인한다. 방향은 사용자가 고른 **여백의 노트**다.

## 참고한 것 (2026-11-18)

사용자 요청: 글꼴, 자간 등 정할 것이 많으니 잘 정리된 DESIGN.md 모음이나 최신 자료를 참고한다.

| 자료 | 가져온 것 |
|---|---|
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT, 브랜드 84개) | 파일 구성. Google 형식의 절에 더해 **Responsive Behavior**, **Iteration Guide**(에이전트가 따를 작업 규칙), **Known Gaps**(아직 정하지 않은 것)를 둔다. 글자 단계를 `크기 / 굵기 / 행간 / 자간` 토큰으로 적는다 (Notion, WIRED, Claude 파일 확인) |
| 같은 모음의 WIRED | 편집 매체의 규칙: 그림자 없음, 가는 선으로 기사 행 구분, 버튼과 입력란은 각지게, 강조색은 링크 하나 |
| 같은 모음의 Claude | **반면교사**: 크림 바탕, 코랄 강조, 큰 세리프 제목 — 2026년의 "AI 느낌" 기본값과 같은 조합이라 피한다 |
| Apple 한국 App Store CSS | 한국어 본문 행간 1.747, 자간 0em, `word-break: keep-all` |
| W3C 한글 조판 요구사항 (klreq) | 한글은 글자 사이 0 이 기본. 줄 머리·줄 끝 금칙 |
| daleseo.com (CSS 줄바꿈) | `keep-all` 과 `overflow-wrap: break-word` 를 함께. 제목은 `text-wrap: balance`, 본문은 `text-wrap: pretty` |
| Pretendard (OFL) | 고딕 후보. 권장 글꼴 목록, Next.js 의 `localFont` 예 |

## 요구사항

1. **`DESIGN.md`** (저장소 루트): DESIGN.md 형식(alpha, `google-labs-code/design.md`)을 따른다. YAML 머리말에 토큰(colors, typography, rounded, spacing, components), 본문은 정해진 순서의 절(Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts). `npx @google/design.md lint` 에 오류가 없다.
2. **한곳의 원본**: 색과 둥글기의 값은 DESIGN.md 가 원본이다. `globals.css` 의 `:root` 토큰은 같은 이름, 같은 값이다. 테스트가 두 파일을 읽어 비교한다.
3. **여백의 노트** (아래 §핵심 전략의 값): 차가운 흰 종이, 책 제목과 인용은 명조·화면 글자는 고딕, 카드와 그림자 대신 가는 선, 작은 둥글기, 왼쪽 정렬의 한 단.
4. **글쓴이 잉크**: 내 글, AI 글, 외부 인용을 구분하는 토큰을 둔다 (`ink-me`, `ink-ai`, `ink-quote`). 컴포넌트는 처음 쓰는 spec(spec-01-10)에서 만들지만 토큰과 규칙은 지금 정한다.
5. **채점처럼 보이지 않는다**: 독자의 글에 빨간색을 쓰지 않는다. 오류 색(`destructive`)은 시스템 오류와 입력 검사에만 쓴다.
6. **하지 말 것**: 흔한 AI 기본값을 DESIGN.md 의 Do's and Don'ts 에 적는다 (보라·남색 그라데이션, 그림자 떠 있는 카드, 가운데 정렬 히어로와 카드 셋, 이모지 제목, 반짝이 아이콘, 그리고 2026년의 새 기본값인 크림 바탕·주황 강조·큰 이탤릭 세리프 제목). 문구는 해요체로 담백하게, 과장 문구 금지.
7. **글꼴**: 명조 후보 셋(Noto Serif KR, 고운바탕, 함렛)과 고딕 후보 둘(시스템 고딕, Pretendard)로 견본을 만들어 사용자가 고른다 (Task 3, 사용자 결정 지점). 고른 글꼴을 `next/font` 로 불러 토큰(`--font-serif`, `--font-sans`)에 연결한다.
7-1. **글자 단계와 한국어 조판**: 아래 §글자 단계의 토큰을 DESIGN.md 와 `globals.css` 에 둔다. 본문 자간 0, 행간 1.75, `word-break: keep-all` + `overflow-wrap: break-word`, 제목 `text-wrap: balance`, 본문 `text-wrap: pretty`.
7-2. **에이전트 규칙**: DESIGN.md 에 Iteration Guide(토큰 이름만 쓴다, 16진수를 화면 코드에 쓰지 않는다, 한 번에 한 부품, 고친 뒤 형식 검사)와 Known Gaps(다크 모드, 움직임)를 둔다.
8. **기존 화면 적용**: 책 목록(카드 → 가는 선의 목록), 책 등록, 책 정보, 첫 화면 머리를 새 규칙으로 다듬는다. 기능은 바꾸지 않는다.
9. **에이전트 지침**: `CLAUDE.md` 에 "화면을 만들거나 고칠 때 `DESIGN.md` 를 따른다"를 넣는다.
10. **검사 연결**: `pnpm lint` 가 DESIGN.md 의 형식 검사도 돈다.

## Out of Scope

- 다크 모드 (이번에는 밝은 테마 하나. shadcn 의 `.dark` 값은 지운다)
- 글쓴이 표시 컴포넌트 (spec-01-10), 글쓰기 화면 (spec-01-07)
- 로고, 아이콘 세트, 그림
- Storybook

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **값의 제안** (§핵심 전략 표). 특히 주 색(버튼)을 파랑이 아니라 **잉크 검정**으로 둔다. 파랑은 "내가 쓴 글"에만 쓴다. 버튼까지 파랗게 하면 "내 글" 표시와 섞이기 때문이다.
> - [ ] **명조 글꼴 후보 셋**: Noto Serif KR, 고운바탕(Gowun Batang), 함렛(Hahmlet). 셋 다 `next/font/google` 에 있어 빌드 때 받아 자체 호스팅된다. Task 3 에서 견본 화면을 만들어 경로를 알려 드리면, 보시고 하나를 골라 주시면 된다. 그 전까지 진행이 멈춘다.
> - [ ] **DESIGN.md 를 원본**으로 하고 `globals.css` 가 따라간다. 반대로 하지 않는 이유: DESIGN.md 가 사람과 에이전트가 읽는 문서이고, 형식 검사(대비, 깨진 참조)가 그쪽에 있다.
> - [ ] **DESIGN.md 형식은 alpha** 다. 형식이 바뀌면 문서를 고친다.

> [!WARNING]
> - [ ] 색 값을 OKLCH 에서 16진수로 바꾼다 (DESIGN.md 형식의 권장). 화면의 계산된 색이 조금 바뀐다.
> - [ ] Google Fonts 의 한국어 명조는 크다. 글꼴 파일 크기와 첫 화면 시간을 견본에서 함께 잰다.

## 핵심 전략

### 여백의 노트 — 값의 제안

책 여백에 연필로 적는 느낌. 종이는 차갑게 희고, 글은 잉크다. 장식은 선 하나로 대신한다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `background` | `#F7F8F8` | 종이. 크림이 아니라 차가운 흰색 |
| `foreground` | `#1D1F22` | 잉크 검정. 본문 |
| `muted` | `#EEF0F1` | 옅은 면 (입력란 바탕 등) |
| `muted-foreground` | `#5F6670` | 보조 글자 (작가, 날짜) |
| `border` | `#D9DCDF` | 가는 선. 목록 구분, 입력란 |
| `primary` / `primary-foreground` | `#1D1F22` / `#F7F8F8` | 주 행동 버튼. 잉크 검정 |
| `ring` | `#7A8390` | 초점 표시 |
| `destructive` | `#A33A2B` | 시스템 오류와 입력 검사만. 독자의 글에는 쓰지 않는다 |
| `ink-me` | `#1F3A93` | 내가 쓴 글 (만년필 파랑) |
| `ink-ai` | `#5B6168` | AI 가 쓴 글 (흑연 회색) |
| `ink-quote` | `#1D1F22` + 명조 + 왼쪽 선 | 외부 사람의 인용 |
| 둥글기 `radius` | `4px` (sm `2px`) | 작게. 둥근 알약 모양 버튼 없음 |
| 글꼴 | 고딕: 시스템 (Apple SD Gothic Neo, Noto Sans KR …) / 명조: 후보 중 선택 | 명조는 책 제목, 인용, 머리 제목에만 |
| 행간 | 본문 1.75 | 한국어 본문 |
| 너비 | 본문 한 단 최대 42rem, 왼쪽 정렬 | 가운데 정렬 히어로 없음 |

대비는 DESIGN.md 형식 검사(WCAG AA 4.5:1)로 확인한다.

### 글자 단계 (제안, 견본에서 확인)

한국어는 글자 사이 0 이 기본이다 (Apple, klreq). 영문 브랜드 파일의 큰 제목 음수 자간(-1px 이상)은 그대로 가져오지 않고, 큰 명조 제목에만 아주 작게 준다.

| 토큰 | 글꼴 | 크기 | 굵기 | 행간 | 자간 | 쓰임 |
|---|---|---|---|---|---|---|
| `display` | 명조 | 32px (모바일 26px) | 500 | 1.25 | -0.01em | 책 정보의 책 제목 |
| `heading-1` | 고딕 | 24px | 600 | 1.3 | 0 | 화면 제목 |
| `heading-2` | 고딕 | 18px | 600 | 1.4 | 0 | 절 제목 |
| `title-book` | 명조 | 18px | 500 | 1.4 | 0 | 목록의 책 제목 |
| `body-reading` | 고딕 | 17px | 400 | 1.8 | 0 | 긴 글 (내 해석 등, spec-01-07) |
| `quote` | 명조 | 17px | 400 | 1.8 | 0 | 외부 인용 |
| `body-md` | 고딕 | 16px | 400 | 1.75 | 0 | 기본 본문 |
| `body-sm` | 고딕 | 14px | 400 | 1.6 | 0 | 보조 글 |
| `label` | 고딕 | 14px | 500 | 1.4 | 0 | 버튼, 입력란 이름 |
| `caption` | 고딕 | 13px | 400 | 1.5 | 0 | 작가·장르, 날짜 |

- 간격: 4px 단위 (4, 8, 12, 16, 24, 32, 48, 64).
- 글 너비: 한 단 최대 42rem (16px 기준 약 40자). 한국어 한 줄 글자 수의 권장값은 확인한 자료에 없어 견본에서 읽기 좋은지 본다.
- 그림자: 없음. 층은 가는 선(1px `border`)으로만 나눈다 (WIRED 방식).

### 원본과 동기화

```
DESIGN.md (머리말의 colors, rounded) ──테스트로 비교──> apps/web/src/app/globals.css (:root)
                                                          └─ @theme inline ─> Tailwind 클래스 (bg-background, text-ink-me …)
```

- 테스트 `apps/web/src/design-tokens.test.ts`: DESIGN.md 머리말을 YAML 로 읽고, `globals.css` 의 `:root` 변수와 이름·값이 같은지 본다. DESIGN.md 에만 있거나 `:root` 에만 있는 색 토큰도 실패로 본다.
- 형식 검사: 루트 `pnpm lint` 가 `design.md lint DESIGN.md` 를 함께 돈다 (오류가 있으면 실패).

### 화면 적용

| 화면 | 바뀌는 것 |
|---|---|
| 공통 | 종이 바탕, 잉크 글자, 시스템 고딕. 머리 제목과 책 제목은 명조 |
| 첫 화면 | 제품 이름을 명조로 작게, 소개 한 줄. 목록 위에 가는 선 |
| 책 목록 | 카드(그림자) → 가는 선으로 나눈 목록. 책 제목 명조, 작가·장르는 보조 글자 |
| 책 등록 | 입력란은 아래 선 또는 가는 테두리, 작은 둥글기. 버튼은 잉크 검정 |
| 책 정보 | 제목 명조 크게, 작가·장르 보조 글자. "모임 시작"은 그대로 비활성 |

shadcn/ui 부품(`apps/web/src/ui/`)은 토큰만 바꿔 따라오게 하고, 필요한 곳(카드의 그림자, 버튼 둥글기)만 부품 안에서 고친다.

## Proposed Changes

#### [NEW] `DESIGN.md`
#### [NEW] `docs/decisions/ADR-011-design-system.md`
여백의 노트, DESIGN.md 를 원본으로, 동기화 테스트.
#### [MODIFY] `apps/web/src/app/globals.css`
16진수 토큰, 글쓴이 잉크, 명조 글꼴 토큰, `.dark` 삭제.
#### [MODIFY] `apps/web/src/app/layout.tsx`
명조 글꼴(`next/font/google`) 연결.
#### [NEW] `apps/web/src/design-tokens.test.ts`
#### [MODIFY] `apps/web/src/features/books/*.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/books/**`, `apps/web/src/ui/{card,button,input}.tsx`
#### [NEW] (임시, 커밋하지 않음) 글꼴 견본 화면
#### [MODIFY] `CLAUDE.md`, 루트 `package.json` (`lint` 에 DESIGN.md 검사, 개발 의존성 `@google/design.md`, `yaml`)
#### [MODIFY] `docs/architecture.md` §6, `README.md` §테마, ADR-007 §4 (원본이 DESIGN.md 임을 적음)

## 검증 계획

```bash
pnpm lint            # ESLint + DESIGN.md 형식 검사
pnpm typecheck && pnpm test
docker compose up -d --wait && pnpm test:e2e && pnpm build
```

수동 검증 시나리오:
1. 첫 화면, 책 등록, 책 정보를 연다 — 기대 결과: 그림자 카드와 회색 기본 테마가 없고, 책 제목이 명조로 보인다. 스크린숏을 남긴다.
2. DESIGN.md 의 `primary` 값만 바꾸고 테스트를 돈다 — 기대 결과: 동기화 테스트가 실패한다. 되돌린다.
3. `globals.css` 에서 `--primary` 를 바꿔 화면의 버튼 색이 바뀌는지 본다 (spec-01-04 와 같은 확인). 되돌린다.
4. DESIGN.md 의 Do's and Don'ts 를 지금 화면과 대조한다 — 기대 결과: 어긋나는 곳이 없다.

## 롤백 계획

- `git revert`. 상태와 DB 영향 없음.

## ADR 후보

- [x] ADR 가치 있는 결정 있음 → `ADR-011-design-system` (type: convention)
- [ ] 없음

## ✅ Definition of Done

- [ ] DESIGN.md 형식 검사에 오류 없음, 동기화 테스트 통과
- [ ] 명조 글꼴을 사용자가 골라 적용
- [ ] 화면 넷을 새 규칙으로 다듬음, 스크린숏
- [ ] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드와 E2E 통과
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-01-06-design-system` 브랜치 push 완료
