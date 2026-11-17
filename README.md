# inkle

혼자서도 열리는 독서 모임.

책을 읽은 뒤 내 해석을 먼저 쓰고, 그 해석을 작품의 배경과 다른 사람들의 실제 시선에 비춰 본다. 지금은 만든 사람 혼자 로컬에서 쓰는 단계다.

- 제품 목표와 원칙: `docs/goals.md`
- 지금 단계의 계획: `backlog/phase-01.md`
- 아키텍처: `docs/architecture.md` (결정과 이유는 `docs/decisions/README.md`)

## 구성

pnpm 워크스페이스 모노레포다 (ADR-010). 실행 단위, 폴더 구조, 패키지 의존성 규칙은 `docs/architecture.md` §1, §2.

| 앱 / 패키지 | 어디서 뜨나 | 하는 일 |
|---|---|---|
| `apps/web` (`@inkle/web`) | docker compose (`web`) | 화면 (Next.js). `/api/…` 요청은 API 서버로 넘긴다 |
| `apps/api` (`@inkle/api`) | docker compose (`api`) | HTTP API (엔드포인트 문서는 `/api/openapi.json`). 뜰 때 마이그레이션 적용 |
| `apps/worker` (`@inkle/worker`) | 호스트 | 작업 프로세스. LLM 은 이 기기에 로그인된 Claude Code CLI 로 부른다 |
| `packages/contract` (`@inkle/contract`) | - | HTTP 계약 (web 과 backend 가 함께 쓴다) |
| `packages/backend` (`@inkle/backend`) | - | 서버 코드 (domain, application, infrastructure, rpc, 조립) |
| DB (Postgres) | docker compose (`db`) | 모든 자료와 작업 대기열 |

작업 프로세스를 호스트에서 띄우는 이유는 `docs/decisions/ADR-004-llm-grounding.md` §가정의 확인 결과에 있다.

## 준비물

- Docker (Compose 포함)
- Node.js 22, pnpm 9
- Chromium (화면 테스트용): `pnpm exec playwright install chromium`
- Claude Code CLI, 로그인된 상태 (`claude` 를 한 번 실행해 로그인한다). LLM 을 쓰는 작업이 생기면 필요하다

API 키는 쓰지 않는다.

## 실행

```bash
pnpm install
docker compose up -d --wait     # 화면(web), API 서버(api), DB. API 서버가 뜰 때 마이그레이션을 적용한다
                                # 처음 한 번, 또는 의존성이 바뀌면: docker compose up -d --wait --build -V
pnpm worker                     # 작업 프로세스 (호스트, 다른 터미널에서)
```

- 화면: http://localhost:3000 (책 목록), `/books/new` (책 등록), `/books/{bookId}` (책 정보, 모임 시작), `/sessions/{sessionId}/interpretation` (내 해석 쓰기)
- 상태 확인: http://localhost:3000/api/health (API 서버 직접: http://localhost:4000/api/health)
- 엔드포인트 문서 (OpenAPI): http://localhost:3000/api/openapi.json
- DB: `127.0.0.1:54329` (이 기기 안쪽에만 열린다. 사용자 `inkle`, 비밀번호 없음)

멈출 때는 `docker compose down`. 자료는 DB 볼륨에 남는다. 자료까지 지우려면 `docker compose down -v`.

## 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `pnpm db:migrate` | 아직 적용하지 않은 마이그레이션을 적용한다 (`packages/backend/src/infrastructure/db/migrations/`) |
| `pnpm job:enqueue noop` | 시험용 작업을 하나 넣는다. 작업 프로세스가 처리하면 상태가 `done` 이 된다 |
| `pnpm lint` | lint |
| `pnpm typecheck` | 타입 검사 |
| `pnpm test:unit` | DB 없이 도는 테스트만 (유스케이스, 메모리 저장소, API 처리, 의존 규칙, 화면 컴포넌트) |
| `pnpm test:e2e` | 흐름 테스트 (Playwright). 먼저 `docker compose up -d --wait`. 개발 DB 에 시험용 책(`E2E 시험용 책 …`)이 남는다 |
| `pnpm test` | 전체 테스트 (Node 와 브라우저 프로젝트). DB 가 떠 있어야 한다 (`docker compose up -d --wait db`). 개발 DB 가 아니라 `inkle_test` 데이터베이스를 비우고 쓴다 |

## 환경 변수

`.env.example` 을 참고한다. 지금은 `.env` 가 없어도 동작한다.

`CLAUDE_CODE_OAUTH_TOKEN` 은 비워 둔다. 작업 프로세스를 컨테이너에서 띄우고 싶을 때만 `claude setup-token` 으로 받은 토큰을 넣고 `docker compose --profile container-worker up -d` 를 쓴다. 이 경로는 확인되지 않았다.

## 폴더

| 폴더 | 내용 |
|---|---|
| `apps/web/src/app/` | 화면 라우트 (자료를 읽지 않는 틀), `globals.css` (테마 토큰) |
| `apps/web/src/features/` | 기능별 화면 컴포넌트와 양식 |
| `apps/web/src/ui/` | shadcn/ui 공통 부품 (Radix UI) |
| `apps/web/src/api-client/` | HTTP 클라이언트 (오류 정규화, 시간 제한, TanStack Query 연동) |
| `apps/web/src/testing/` | 브라우저 테스트 도우미 (MSW, 렌더링) |
| `apps/api/src/` | API 서버 진입점, `db:migrate`, `job:enqueue` |
| `apps/worker/src/` | 작업 프로세스 진입점 |
| `packages/contract/src/` | HTTP 계약: 엔드포인트, 요청·응답, 오류의 유일한 원본 (oRPC) |
| `packages/backend/src/` | `domain/`, `application/`(유스케이스, 포트), `infrastructure/`(Postgres, 마이그레이션), `rpc/`(계약 구현), `server/`(API 서버 생성), `worker/`(작업 처리기), `container.ts`(조립), `testing/` |
| `e2e/` | Playwright 흐름 테스트 |
| `tests/` | 저장소 수준 테스트 (패키지 의존성 규칙) |
| `scripts/spike/` | 일회성 확인 스크립트 |
| `docs/` | 목표, 아키텍처, 결정, 실험 기록 |
| `backlog/`, `specs/` | 작업 계획 (harness-kit) |

## 디자인

디자인 규칙과 값의 원본은 저장소 루트의 `DESIGN.md` 다 (방향: 여백의 노트, ADR-011). 화면을 만들거나 고칠 때 먼저 읽는다.

- 화면 토큰(`apps/web/src/app/globals.css`)은 DESIGN.md 의 값을 그대로 옮기고, 테스트가 두 파일을 비교한다. 값을 바꿀 때는 DESIGN.md 를 먼저 고친다.
- 화면 코드는 토큰 이름(`bg-background`, `text-title-book` …)만 쓴다. 팔레트 색이나 눈금 밖 값은 lint(`@shadcn/lint`)가 막는다.
- `pnpm lint` 는 DESIGN.md 의 형식과 대비도 검사한다 (`pnpm design:lint`).
- 공통 부품은 `apps/web` 에서 `pnpm dlx shadcn@latest add <부품>` 으로 `apps/web/src/ui/` 에 추가한 뒤 DESIGN.md 에 맞게 다듬는다.
- 화면 스크린숏: `docs/design/screens/`
