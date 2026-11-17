# Task List: spec-01-06

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 계획 문서

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-06-design-system`

### 1-2. 문서
- [x] `spec.md`, `task.md`, sdd 자동 갱신분
- [x] Commit: `docs(spec-01-06): add spec and task for design system`

---

## Task 2: DESIGN.md 와 토큰 동기화

### 2-1. 테스트 작성 (TDD Red)
- [x] `apps/web/src/design-tokens.test.ts`: DESIGN.md 머리말의 colors·rounded 와 `globals.css` `:root` 가 같은 이름·같은 값
- [x] 테스트 실행 → Fail 확인 (DESIGN.md 없음)

### 2-2. 구현 (TDD Green)
- [x] `DESIGN.md` (머리말 토큰: colors, typography 단계, rounded, spacing, components / 절: Google 형식 여덟 + Responsive Behavior, Iteration Guide, Known Gaps). 형식은 `design.md spec` 출력으로 다시 확인
- [x] `globals.css`: 글자 단계 토큰과 한국어 조판 규칙(`keep-all`, `text-wrap`)
- [x] `globals.css`: 16진수 토큰, 글쓴이 잉크, `.dark` 삭제, `@theme inline` 연결
- [x] 루트 `lint` 에 `design.md lint DESIGN.md`. 오류 없음, 대비 경고 없음
- [x] 테스트 실행 → Pass 확인
- [x] Commit: `feat(spec-01-06): add design.md and sync theme tokens`

---

## Task 3: 글꼴 고르기 (사용자 결정)

- [ ] 명조 후보 셋(Noto Serif KR, Gowun Batang, Hahmlet)과 고딕 후보 둘(시스템 고딕, Pretendard)로 견본 화면을 임시로 만든다. 글자 단계 전부를 실제 문장(책 제목, 인용, 긴 해석)으로 보여 주고, 스크린숏과 글꼴 파일 크기를 정리한다
- [ ] **사용자에게 견본을 보여 주고 고를 때까지 멈춘다**
- [ ] 고른 글꼴을 `layout.tsx` 에서 `next/font` 로 불러 `--font-serif`, `--font-sans` 에 연결, DESIGN.md 의 typography 갱신, 견본 화면 삭제
- [ ] Commit: `feat(spec-01-06): load serif font for titles and quotes`

---

## Task 4: 화면 적용

### 4-1. 테스트
- [ ] 기존 화면 테스트와 E2E 가 그대로 통과하는지 (기능은 바꾸지 않는다). 역할과 이름으로 찾으므로 바뀌지 않아야 한다

### 4-2. 구현
- [ ] 첫 화면 머리, 책 목록(가는 선의 목록), 책 등록, 책 정보
- [ ] 부품(`card`, `button`, `input`)의 그림자와 둥글기
- [ ] 스크린숏 (`docs/design/screens/`)
- [ ] lint(`@shadcn/lint` 포함), 테스트, E2E 통과
- [ ] Commit: `feat(spec-01-06): apply margin-note design to book screens`

---

## Task 5: 지침과 문서

- [ ] `CLAUDE.md`: 화면 작업 시 DESIGN.md 를 따른다
- [ ] `docs/decisions/ADR-011-design-system.md`, ADR-007 §4 고침, `docs/architecture.md` §6, `README.md` §테마
- [ ] Commit: `docs(spec-01-06): document design system and agent rule`

---

## Task 6: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS (`pnpm test`, `pnpm test:e2e`)
- [ ] lint (DESIGN.md 포함), 타입 검사, 빌드
- [ ] spec.md 의 수동 검증 시나리오 4개

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-06): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-06-design-system`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
