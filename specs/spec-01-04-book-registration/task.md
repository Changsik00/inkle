# Task List: spec-01-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 계획 문서

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-04-book-registration`

### 1-2. 문서
- [x] `spec.md`, `task.md`, sdd 자동 갱신분
- [x] Commit: `docs(spec-01-04): add spec and task for frontend structure and book registration`

---

## Task 2: ADR-007 프론트 구조

### 2-1. 작성
- [x] `docs/decisions/ADR-007-frontend-structure.md` (일곱 항목, 의존 규칙, 선택지 비교). 이 판의 Next.js 문서와 TanStack Query 의 현재 사용법을 확인하고 쓴다
- [x] `docs/architecture.md` §6, `sdd adr-index`
- [x] Commit: `docs(spec-01-04): add adr-007 frontend structure`

---

## Task 3: 프론트 기반

### 3-1. 공식 문서 확인
- [x] oRPC (계약 우선, OpenAPI 처리기, Next.js 연결, TanStack Query 연동, 서버에서 처리 함수 직접 부르기), nuqs (Next.js 16, Cache Components), Vitest 4 브라우저 모드와 MSW, Playwright, shadcn/ui 설치, `@shadcn/lint` 의 React 설정. 하나라도 spec 의 설명과 다르면 멈추고 보고 — oRPC 문서가 2.0 베타 기준이라 보고했고, 사용자가 1.x 안정판(1.16.2)을 선택. Vitest 는 5, MSW 는 3, React 테스트는 `vitest-browser-react` (ADR-007 §확인)

### 3-2. 테스트 작성 (TDD Red)
- [x] `src/architecture.test.ts`: 화면 코드가 조립·애플리케이션·인프라·도메인을 가져오면 막고, `src/app/api/**` 은 조립을 허용. 계약(`src/http/contract/`)은 React·Next.js 를 가져오지 못함
- [x] `src/architecture.test.ts`: `@shadcn/lint` 가 팔레트 색 직접 사용, 눈금 밖 값, `src/ui/` 부품의 겉모양 덮어쓰기를 막는다 (`src/ui/` 안에서는 허용)
- [x] `src/architecture.test.ts`: 화면 코드의 `fetch` 직접 사용을 막는다
- [x] `src/http/client/` 테스트: 성공 응답, 선언한 오류 코드, 네트워크 오류, 시간 초과, 응답 모양 불일치가 모두 `ApiError` 로 정규화된다
- [x] 브라우저 모드 컴포넌트 테스트 하나와 MSW 흉내가 동작하는지 (시험용 컴포넌트)
- [x] 테스트 실행 → Fail 확인

### 3-3. 구현 (TDD Green)
- [x] 의존성: TanStack Query, nuqs, React Hook Form, oRPC, Testing Library, MSW, Vitest 브라우저 제공자, Playwright, `babel-plugin-react-compiler`
- [x] `next.config.ts`: `typedRoutes`, `reactCompiler`
- [x] `vitest.config.mts`: 프로젝트 둘 (Node: `*.test.ts`, 브라우저: `*.test.tsx`). `test:unit` 은 DB 없는 것만
- [x] shadcn/ui 초기화 (`components.json`, 부품 위치 `src/ui/`, Radix UI)
- [x] `globals.css` 디자인 토큰: 색, 둥글기, 글꼴을 CSS 변수로 정의하고 Tailwind 테마에 연결. 뼈대의 `zinc` 직접 사용과 두 변수뿐인 설정을 교체
- [x] `@shadcn/lint` 와 화면의 의존 규칙 (`eslint.config.mjs`)
- [x] `src/app/providers.tsx` (TanStack Query, nuqs), `layout.tsx` (시스템 글꼴, `lang="ko"`)
- [x] `src/http/contract/index.ts` (계약 묶음), `src/server/rpc/` 기본 구성과 `src/app/api/[...rest]/route.ts`, `/api/openapi.json`
- [x] `src/http/client/` (클라이언트 인스턴스: 기본 주소, 헤더, 시간 제한, 오류 정규화, TanStack Query 연동)
- [x] `playwright.config.ts`, `pnpm test:e2e`
- [x] 테스트 실행 → Pass 확인. `pnpm build` 성공
- [x] Commit: `feat(spec-01-04): add frontend foundation`

---

## Task 4: 책 도메인과 저장소

### 4-1. 테스트 작성 (TDD Red)
- [x] `src/domain/book.test.ts`: 정규화(공백, 대소문자), 길이 규칙
- [x] `src/testing/contracts/book-repository.contract.ts`: 만들기, 찾기, 정규화 키로 찾기, 목록(최근 순), 같은 키 두 번 만들기 거부
- [x] `src/application/books.test.ts` (메모리): 등록, 같은 책이면 `exists`, 규칙 위반은 이유와 함께 거부, 목록, 없는 책
- [x] Postgres 계약 실행, 동시에 같은 책 등록 시 하나만 생김
- [x] 테스트 실행 → Fail 확인

### 4-2. 구현 (TDD Green)
- [x] `src/domain/book.ts`, `src/application/ports.ts` (`BookRepository`), `src/application/books.ts`
- [x] `0002_books.sql`, `PostgresBookRepository`, `InMemoryBookRepository`, `container`
- [x] 테스트 실행 → Pass 확인
- [x] Commit: `feat(spec-01-04): add book domain, use cases and repositories`

---

## Task 5: 책 API (oRPC)

### 5-1. 테스트 작성 (TDD Red)
- [ ] OpenAPI 문서 스냅샷 테스트 (책 엔드포인트 셋이 문서에 있다)
- [ ] `src/server/rpc/books.test.ts` (메모리 저장소로 처리 함수 직접 호출): 목록, 등록, 같은 책은 `CONFLICT` 와 기존 책, 잘못된 입력은 `BAD_REQUEST` 와 이유, 없는 책과 형식이 틀린 id 는 `NOT_FOUND`
- [ ] 테스트 실행 → Fail 확인

### 5-2. 구현 (TDD Green)
- [ ] `src/http/contract/books.ts`, `src/server/rpc/books.ts`, 라우터에 등록
- [ ] 테스트 실행 → Pass 확인. compose 에서 `curl` 로 REST 주소(`/api/books`) 확인
- [ ] Commit: `feat(spec-01-04): add book api with orpc`

---

## Task 6: 책 화면과 E2E

### 6-1. 테스트 작성 (TDD Red)
- [ ] `src/features/books/*.test.tsx` (브라우저 모드, MSW): 목록(비었을 때, 있을 때, 오류), 등록 양식(입력 검사, 등록 뒤 이동, 이미 있는 책 안내, 서버 오류), 책 정보(있음, 없음, "모임 시작"은 눌리지 않음)
- [ ] `e2e/books.spec.ts` (Playwright): 등록 → 책 정보 → 목록에 나타남, 같은 책 다시 등록 시 안내
- [ ] 테스트 실행 → Fail 확인

### 6-2. 구현 (TDD Green)
- [ ] `src/features/books/` (목록, React Hook Form 양식, 책 정보), 필요한 shadcn/ui 부품만 `src/ui/` 에 추가
- [ ] `src/app/page.tsx`, `src/app/books/new/page.tsx`, `src/app/books/[bookId]/page.tsx`, `loading.tsx`, `not-found.tsx`. `src/app/health-status.tsx` 삭제
- [ ] 테스트 실행 → Pass 확인. `pnpm test:e2e`, `pnpm build` 성공
- [ ] Commit: `feat(spec-01-04): add book list, registration and detail screens`

---

## Task 7: 문서

- [ ] `README.md` (폴더 표, 화면 주소), `docs/architecture.md` (포트, 데이터, 흐름의 현재 상태)
- [ ] `backlog/phase-01.md` 결정 기록
- [ ] Commit: `docs(spec-01-04): update readme and architecture for books`

---

## Task 8: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS (`pnpm test`, `pnpm test:e2e`)
- [ ] lint, 타입 검사, 빌드
- [ ] spec.md 의 수동 검증 시나리오 6개 (토큰 하나를 바꿔 전체가 바뀌는지 포함)

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-04): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-04-book-registration`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
