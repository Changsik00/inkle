# feat(spec-01-04): 프론트 구조, src 배치, 별도 API 서버와 책 등록

## 📋 Summary

### 배경 및 목적

제품 화면이 처음 생기는 spec 이다. 화면을 만들기 전에 프론트 구조를 ADR-007 로 정하고, 그 구조로 첫 기능인 책 등록을 서버부터 화면까지 만든다.

### 주요 변경 사항
- [x] **ADR-007 프론트 구조**: 틀만 그리는 페이지, 기능 단위 클라이언트 컴포넌트, TanStack Query·nuqs·React Hook Form, `typedRoutes`, React Compiler
- [x] **HTTP**: oRPC 1.x 계약 하나(`src/http/contract/`)에서 엔드포인트·요청·응답·오류를 정한다. REST 주소와 `/api/openapi.json`. 서버 구현은 `src/server/rpc/`, 화면은 `src/http/client/`(오류 정규화, 시간 제한, 응답 모양 검사, TanStack Query 연동)만 거친다
- [x] **UI**: Tailwind 4, shadcn/ui(Radix) 부품을 `src/ui/` 에, 테마 값은 `globals.css` 토큰에서만, `@shadcn/lint` 로 강제
- [x] **테스트**: Vitest 프로젝트 둘(Node, 브라우저 모드 + MSW), Playwright E2E, 의존 규칙과 UI 규칙의 lint 테스트
- [x] **책 등록**: 도메인 규칙(다듬기, 같은 책 키, 길이), 유스케이스, 저장소(메모리, Postgres, 계약 테스트), `0002_books.sql`, API(`GET/POST /api/books`, `GET /api/books/{bookId}`), 화면(목록, 등록, 책 정보)
- [x] 상태 확인 API 를 계약으로 옮김 (`/api/health`, 동작 같음)
- [x] **src 배치 (리뷰 반영, ADR-008)**: `src/backend/`, `src/frontend/`, `src/shared/`. backend 와 frontend 는 서로 가져오지 않고 shared(HTTP 계약)만 함께 쓴다. `src/app/` 은 Next.js 라우트의 얕은 입구. lint 와 테스트로 강제
- [x] **별도 API 서버 (리뷰 반영, ADR-009)**: backend 가 Node `http` + oRPC 처리기로 따로 뜬다 (`src/backend/server/`, `pnpm api`). Next.js 는 화면만 내고 `/api/*` 를 rewrites 로 넘긴다. compose 는 web · api · db
- [x] **아키텍처 문서**: 현재 구조(실행 단위, 폴더, 묶여 있는 것)와 모노레포로 옮길 때의 대응표·순서 (`docs/architecture.md` §1, §2)

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: B 구간(첫 모임)의 첫 spec. 이후 화면이 따를 구조를 정한다.

## 🎯 Key Review Points

1. **API 는 별도 서버 (ADR-009).** `src/app/api` 는 없어졌다. 개발 중 요청은 Next.js 를 거쳐 API 서버로 간다. ADR-001 의 §1·§2 를 대체한다.
2. **다음은 모노레포 전환이다.** 서버가 둘이 되었으니 다음 spec(spec-01-05)에서 pnpm 워크스페이스로 나눈다. ADR-008 은 대체 예정으로 표시했고, 대응표와 순서는 `docs/architecture.md` §2-0. 디자인 시스템은 그다음(spec-01-06).
   **src 배치 (ADR-008).** 경로가 모두 바뀌었다. 동작은 같고, 규칙 테스트가 경계를 확인한다.
3. **Server Actions 를 쓰지 않는다.** 최근 흐름과 다르지만 ADR-001 의 "화면은 HTTP API 로만"을 유지했다 (모바일 가정, 성공 기준 5 의 API 검증).
4. **oRPC 1.16.2.** 공식 문서가 2.0 베타 기준이라 1.x 사용법은 패키지 타입으로 확인했다. 2.0 정식판이 나오면 판 올림이 필요하다.
5. **의존성이 크게 늘었다.** 목록은 `walkthrough.md` §발견 사항.
6. **같은 책 판정**: 다듬은 제목과 작가를 NFC 정규화하고 대소문자를 무시한 키에 유일 인덱스. 번역본과 판본은 구분하지 않는다. 동시에 등록해도 하나만 생긴다.
7. **E2E 는 개발 DB 에 시험용 책을 남긴다** (`E2E 시험용 책 …`).

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

**결과 요약**:
- ✅ lint, 타입 검사, 빌드
- ✅ Vitest 152개 (19 파일, Node + 브라우저 Chromium)
- ✅ Playwright 4개

### 수동 검증 시나리오
1. **등록 흐름**: E2E → 책 정보로 이동, 목록에 나타남
2. **같은 책 재등록**: E2E → 안내와 기존 책 링크
3. **규칙 위반**: `curl` → 400 `INVALID_BOOK` 과 이유
4. **없는 책**: E2E → "책을 찾을 수 없어요"
5. **재시작 뒤 유지**: `docker compose down` → `up` → 남아 있음
6. **테마 한곳 변경**: `--primary` 하나만 바꿔 버튼 색이 바뀜, 되돌림

## 📦 Files Changed

경로는 ADR-008 의 배치 기준이다.

### 🆕 New Files
- `docs/decisions/ADR-007-frontend-structure.md`, `docs/decisions/ADR-008-src-layout.md`, `docs/decisions/ADR-009-separate-api-server.md`
- `src/backend/server/` (API 서버와 테스트)
- `src/shared/contract/` (health, books)
- `src/frontend/`: `api-client/` (클라이언트, 오류, QueryClient), `features/` (books, system), `ui/` (shadcn/ui 부품), `providers.tsx`, `testing/` (MSW, 렌더링)
- `src/backend/rpc/` (계약 구현, 라우터, 처리기, OpenAPI 문서, 테스트와 스냅샷)
- `src/backend/domain/book.ts`, `src/backend/application/books.ts`, `src/backend/infrastructure/db/migrations/0002_books.sql`, `src/backend/infrastructure/repositories/postgres-book-repository.ts`
- `src/backend/testing/` (책 저장소 메모리 구현과 계약, RPC 문맥)
- `src/app/books/`, `src/app/not-found.tsx`
- `e2e/`, `playwright.config.ts`, `components.json`

### 🔀 Moved
- `src/domain`, `src/application`, `src/infrastructure`, `src/worker`, `src/cli` → `src/backend/…`
- `src/server/container.ts` → `src/backend/container.ts`
- `src/testing/{contracts,in-memory,postgres.ts}` → `src/backend/testing/`
- `src/product.ts` → `src/shared/product.ts`

### 🛠 Modified Files
- `eslint.config.mjs`: 영역 경계, backend 계층, 화면의 `fetch` 금지, `@shadcn/lint`
- `src/architecture.test.ts`: 경계와 UI 규칙의 확인
- `vitest.config.mts`: Node 와 브라우저 프로젝트
- `next.config.ts`: `typedRoutes`, `reactCompiler`, `/api` rewrites
- `compose.yaml`: `api` 서비스, web 은 DB 에 닿지 않음
- `src/app/globals.css`, `layout.tsx`, `page.tsx`: 토큰, 제공자, 시스템 글꼴, 책 목록
- `package.json`: 의존성, 스크립트 경로
- `README.md`, `docs/architecture.md`, `docs/decisions/ADR-006`, `backlog/phase-01.md`

### 🗑 Deleted Files
- 뼈대의 Next.js API route (계약과 별도 API 서버로 옮김), `src/app/health-status.tsx` (`src/frontend/features/system/` 로 옮김)

## ✅ Definition of Done

- [x] ADR-007 과 `docs/architecture.md` §6
- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드 성공
- [x] 수동 검증 시나리오 6개 확인
- [x] src 배치 (계획 변경)
- [x] 별도 API 서버와 아키텍처 문서 (계획 변경 2)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-04-book-registration/walkthrough.md`
- 아키텍처: `docs/architecture.md`
- ADR: `docs/decisions/ADR-007-frontend-structure.md`, `docs/decisions/ADR-008-src-layout.md`, `docs/decisions/ADR-009-separate-api-server.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
