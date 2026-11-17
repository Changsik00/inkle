# Walkthrough: spec-01-04

> 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 프론트 구조 | (Plan 에서 여러 번 고침) | ADR-007 | 사용자 요청: 최신 흐름, 엔드포인트·요청·응답 관리와 HTTP 클라이언트, Radix 기반 UI 와 lint, 테마 한곳 |
| oRPC 판 | 1.x 안정판 / 2.0 베타 / 빼고 직접 | 1.16.2 | 사용자 결정. 공식 문서가 2.0 베타 기준이라 Task 3 에서 멈추고 물었다. 1.x 사용법은 패키지 타입으로 확인 |
| 상태 확인 API | 따로 둔 route 파일 / 계약에 넣기 | 계약에 넣음 (`health.check`) | 엔드포인트의 유일한 원본을 지킨다. 동작(200 / 503)은 같다 |
| `health-status.tsx` | 지우기 / 기능 폴더로 옮기기 | `src/features/system/` 로 옮겨 첫 화면 아래에 남김 | spec 은 지우기였으나, 브라우저 테스트의 첫 사례와 개발 중 확인용으로 쓸모가 있었다 |
| 응답 모양 검사 | 하지 않음 / 클라이언트에서 계약으로 검사 | oRPC `ResponseValidationPlugin` | 서버가 계약과 다른 응답을 보내면 `INVALID_RESPONSE` 로 드러난다 |
| 화면 오류 | 라이브러리 오류 그대로 / 하나로 정규화 | `ApiError(code, status, data)` | 화면은 코드로만 분기한다. 클라이언트를 Proxy 로 감싸 모든 호출에 적용 |
| 같은 책 판정 키 | NUL 구분자 / 탭 구분자 | 탭 | Postgres 문자열에 NUL(0x00)을 넣을 수 없었다. 다듬기가 모든 공백을 한 칸으로 바꾸므로 값 안에 탭은 남지 않는다 |
| 책 길이 제한의 위치 | 계약 / 도메인 | 도메인이 판단, 계약에는 같은 값의 상수 | 화면이 미리 확인하려면 계약에 값이 있어야 한다. 서버 테스트가 두 값이 같은지 확인 |
| 등록 뒤 이동 | 양식 안에서 / 바깥에서 | 양식은 `onRegistered` 로 알리고 화면 래퍼가 이동 | 브라우저 테스트에 Next.js 라우터가 없다 |
| `useParams()` | 페이지 최상단 / `Suspense` 안 | `Suspense` 안 | Cache Components 에서 빌드가 실패했다. Next.js 가 안내하는 방식 |
| 화면 테스트 렌더러 | Testing Library / `vitest-browser-react` | 후자 | Vitest 5 문서가 권한다 |
| 글꼴 | Geist / 시스템 글꼴 | 시스템 글꼴 (토큰 `--app-font-sans`) | 한국어 화면. shadcn 초기화가 만든 `--font-sans` 순환 참조도 함께 고쳤다 |

| `src` 배치 (PR #4 리뷰) | 같은 단에 섞음 / src 안에서 backend·frontend·shared / 모노레포 | src 안에서 나눔 | 사용자 결정. 모노레포는 설정이 크게 늘고 ADR-001 을 바꿔야 한다 |
| 계약의 자리 | frontend 안 / backend 안 / shared | `src/shared/contract/` | 서버와 화면이 함께 쓰는 유일한 것 |
| HTTP 클라이언트 폴더 이름 | `http/client` / `api-client` | `src/frontend/api-client/` | 계약과 떨어지면서 무엇인지 이름으로 드러나게 |

| API 의 입구 (PR #4 리뷰) | Next.js route 파일 / 루트 app 폴더 / 라우트 그룹 / 별도 서버 | 별도 API 서버 (`src/backend/server/`), Next.js 는 rewrites 로 넘김 | 사용자 결정. `src/app` 은 화면만, 배포 분리에 가까워짐 |
| API 서버의 HTTP 층 | Hono 등 / Node `http` + oRPC 처리기 | Node `http` | 계약 처리와 문서 하나뿐이라 충분하다 |
| 마이그레이션 적용 위치 | web / api | api | web 은 DB 에 닿지 않는다 |

새 ADR: ADR-007 프론트 구조, ADR-008 src 배치, ADR-009 별도 API 서버.

## 💬 사용자 협의

- **주제**: 프론트 구조 (Plan 단계)
  - **합의**: 처음 안(TanStack Query, 기능 폴더)에서 출발해 사용자 요청으로 넓혔다. Radix 기반 UI 와 lint → shadcn/ui 와 `@shadcn/lint`. Tailwind 가 기본인지, 테마를 한곳에서 바꾸는지 → 토큰과 lint 로 강제. 최신 흐름의 라우터·상태·HTTP·테스트 → nuqs, React Hook Form, oRPC, Vitest 브라우저 모드, MSW, Playwright, React Compiler. 엔드포인트와 요청·응답 관리, HTTP 클라이언트 → 계약 하나와 `src/http/client/`.
- **주제**: src 배치 (PR #4 리뷰)
  - **합의**: 사용자가 "src 아래 백엔드와 프론트가 섞여 있으니 구분하자"고 요청했다. src 안에서 backend · frontend · shared 로 나누고, PR #4 병합 전에 이 spec 에서 하기로 골랐다.
- **주제**: 배포 때의 분리 (PR #4 리뷰)
  - **합의**: 지금은 Next.js 가 서버와 화면을 함께 운영하지만, 배포 때는 화면 정적 + API 분리(모노레포)가 나을 수 있다. ADR-008 §다시 볼 때와 `docs/goals.md` 열린 질문에 기록했다.
- **주제**: `src/app/api` 가 헷갈림 (PR #4 리뷰)
  - **합의**: API 를 별도 서버로 띄운다. 현재 구조와 모노레포로 옮길 때의 대응표를 `docs/architecture.md` §2 에 정리한다.
- **주제**: DESIGN.md (PR #4 리뷰)
  - **합의**: "AI 가 만든 느낌을 피하는" 디자인 문서를 만든다. 방향은 "여백의 노트", 작업은 PR #4 병합 뒤 새 spec 에서 한다.
- **주제**: oRPC 판 (Task 3)
  - **합의**: 1.x 안정판.

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`
- **결과**: ✅ Passed
```text
 Test Files  18 passed (18)
      Tests  152 passed (152)
  4 passed (Playwright)
```

마지막으로 API 서버를 분리한 뒤 다시 돌린 결과다 (Test Files 19). API 서버 테스트는 실제 HTTP 서버를 띄워 부른다. compose 로 web · api · db 를 띄워 E2E 가 rewrites 를 거쳐 통과했고, DB 를 멈추면 `/api/health` 가 web 을 거쳐서도 503 이었다.

src 배치를 바꾼 뒤 다시 돌린 결과다. 경계 규칙 테스트가 늘었다 (frontend ↔ backend, shared). 이동 뒤에도 compose, `pnpm worker`, `pnpm job:enqueue`, `pnpm db:migrate`, `pnpm build` 가 그대로 동작했다.

| 추가된 테스트 | 확인하는 것 |
|---|---|
| `src/architecture.test.ts` | 화면 코드의 서버·도메인 가져오기, 계약의 React·Next.js 가져오기, 화면의 `fetch` 직접 사용, 팔레트 색, 눈금 밖 값, 공통 부품 덮어쓰기를 lint 가 막는다 |
| `src/http/client/client.test.ts` | 계약의 주소로 요청, 선언한 오류·네트워크 오류·시간 초과·응답 모양 불일치·취소가 모두 `ApiError` 로 |
| `src/domain/book.test.ts` | 다듬기, 같은 책 키, 길이 규칙(이모지 포함) |
| `src/application/books.test.ts` | 등록, 같은 책, 규칙 위반, 확인과 저장 사이의 경쟁 |
| 저장소 계약 (메모리, Postgres) | 만들기, 찾기, 키로 찾기, 중복 거부, 최근 순 |
| `postgres-repositories.test.ts` | 같은 책을 동시에 넷이 등록해도 하나만 생김 |
| `src/server/rpc/*.test.ts` | 처리 함수의 오류 코드, HTTP 상태(201, 409, 400, 404, 깨진 JSON), 엔드포인트 문서와 스냅샷 |
| `src/features/**/*.test.tsx` (브라우저) | 목록(빈, 있음, 오류와 다시 시도), 양식(입력 검사, 등록, 이미 있음, 서버 규칙 위반, 그 밖의 오류), 책 정보(있음, 없음) |
| `e2e/` | 첫 화면과 DB 상태, 엔드포인트 문서, 등록 → 책 정보 → 목록, 같은 책 재등록 안내와 이동, 없는 책 |

### 수동 검증

1. **등록 흐름** — E2E 로 확인 (`e2e/books.spec.ts`).
2. **같은 책 재등록** — E2E 로 확인. 공백과 대소문자만 바꿔 다시 등록하면 안내와 기존 책 링크가 나온다.
3. **규칙 위반** — `curl` 로 빈 제목을 보내 400 `INVALID_BOOK` 과 이유를 받았다. 화면은 브라우저 테스트로 확인.
4. **없는 책** — E2E 로 확인.
5. **재시작 뒤 유지** — 책을 등록하고 `docker compose down` → `up` 뒤 목록에 남아 있었다.
6. **테마 한곳 변경** — `globals.css` 의 `--primary` 하나만 바꾸자 첫 화면 "책 등록" 버튼의 계산된 배경색이 `lab(7.8 0 0)` 에서 `lab(45.7 14.2 -69.8)` 로 바뀌었다. 되돌린 뒤 원래 값으로 돌아온 것을 확인했다.

## 🔍 발견 사항

- **이 spec 을 세 번 ship 했다.** 첫 ship 뒤 리뷰에서 src 배치, 이어서 API 서버 분리를 하기로 해 그때마다 상태 파일의 spec 과 Plan Accept 를 사용자 승인에 따라 되돌리고 phase 표를 `In Progress` 로 되돌렸다.

- **`@shadcn/lint` 가 바로 효과를 냈다.** 뼈대의 `text-zinc-600` 을 오류로 잡았다.
- **공식 문서와 실제 판이 달랐다.** oRPC 문서는 2.0 베타, Vitest 는 4 가 아니라 5, MSW 는 3 (옵션 이름 `onUnhandledRequest` → `onUnhandledFrame`, 두 번 `start` 하면 오류).
- **E2E 는 개발 DB 에 시험용 책을 남긴다.** 제목이 `E2E 시험용 책 …` 이라 지울 수 있다. E2E 용 DB 를 따로 둘지는 흐름이 길어지면 다시 본다.
- **브라우저 테스트에서 Next.js 의 `next/link` 가 `process.env` 를 읽는다.** 브라우저 프로젝트에 `define` 으로 채웠다.
- **Vitest 브라우저 모드의 `toHaveTextContent` 가 기대와 다르게 동작했다** (부분 일치가 되지 않음). 원인은 확인하지 못했고 `getByText` 로 바꿨다.
- **의존성이 크게 늘었다.** oRPC 7개, TanStack Query, nuqs, React Hook Form, shadcn/ui 와 Radix, `cn`(shadcn 의 클래스 병합 패키지), MSW, Playwright, `@shadcn/lint` 등.
- **커밋 훅의 lint 단계가 삭제된 파일에서 오류를 낸다** (spec-01-03 과 같음). 커밋은 통과한다.
- shadcn/ui 는 `cn` 을 자체 패키지(`cn`)에서 가져온다. `src/ui/utils.ts` 는 그것을 다시 내보낸다.

## 🚧 이월 항목

- DESIGN.md 와 디자인 시스템 (여백의 노트) → 다음 spec (사용자 결정)

- 글쓰기 공통 훅(임시 저장, 이탈 방지) → spec-01-05 (ADR-007 §5)
- 글쓴이와 출처 표시 컴포넌트 → spec-01-07 (ADR-007 §5)
- E2E 전용 DB → 필요해지면
- oRPC 2.0 정식판으로의 판 올림 → 정식판이 나오면
- Storybook, Zustand → 필요해지면 (ADR-007)
