# inkle

혼자서도 열리는 독서 모임.

책을 읽은 뒤 내 해석을 먼저 쓰고, 그 해석을 작품의 배경과 다른 사람들의 실제 시선에 비춰 본다. 지금은 만든 사람 혼자 로컬에서 쓰는 단계다.

- 제품 목표와 원칙: `docs/goals.md`
- 지금 단계의 계획: `backlog/phase-01.md`
- 아키텍처 결정: `docs/decisions/README.md`

## 구성

| 구성 요소 | 어디서 뜨나 | 하는 일 |
|---|---|---|
| 웹 앱 (Next.js) | docker compose | 화면과 HTTP API |
| DB (Postgres) | docker compose | 모든 자료와 작업 대기열 |
| 작업 프로세스 | 호스트 | 대기열의 작업을 처리한다. LLM 은 이 기기에 로그인된 Claude Code CLI 로 부른다 |

작업 프로세스를 호스트에서 띄우는 이유는 `docs/decisions/ADR-004-llm-grounding.md` §가정의 확인 결과에 있다.

## 준비물

- Docker (Compose 포함)
- Node.js 22, pnpm 9
- Claude Code CLI, 로그인된 상태 (`claude` 를 한 번 실행해 로그인한다). LLM 을 쓰는 작업이 생기면 필요하다

API 키는 쓰지 않는다.

## 실행

```bash
pnpm install
docker compose up -d --wait     # 웹 앱과 DB. 웹 앱이 뜰 때 마이그레이션을 적용한다
pnpm worker                     # 작업 프로세스 (호스트, 다른 터미널에서)
```

- 화면: http://localhost:3000
- 상태 확인: http://localhost:3000/api/health
- DB: `127.0.0.1:54329` (이 기기 안쪽에만 열린다. 사용자 `inkle`, 비밀번호 없음)

멈출 때는 `docker compose down`. 자료는 DB 볼륨에 남는다. 자료까지 지우려면 `docker compose down -v`.

## 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `pnpm db:migrate` | 아직 적용하지 않은 마이그레이션을 적용한다 (`src/db/migrations/`) |
| `pnpm job:enqueue noop` | 시험용 작업을 하나 넣는다. 작업 프로세스가 처리하면 상태가 `done` 이 된다 |
| `pnpm lint` | lint |
| `pnpm typecheck` | 타입 검사 |
| `pnpm test` | 테스트. DB 가 떠 있어야 한다 (`docker compose up -d --wait db`). 개발 DB 가 아니라 `inkle_test` 데이터베이스를 비우고 쓴다 |

## 환경 변수

`.env.example` 을 참고한다. 지금은 `.env` 가 없어도 동작한다.

`CLAUDE_CODE_OAUTH_TOKEN` 은 비워 둔다. 작업 프로세스를 컨테이너에서 띄우고 싶을 때만 `claude setup-token` 으로 받은 토큰을 넣고 `docker compose --profile container-worker up -d` 를 쓴다. 이 경로는 확인되지 않았다.

## 폴더

| 폴더 | 내용 |
|---|---|
| `src/app/` | 화면과 HTTP API (`api/`) |
| `src/domain/` | 자료를 읽고 쓰는 함수. 화면과 작업 프로세스는 이 층만 부른다 |
| `src/db/` | DB 연결과 마이그레이션 |
| `src/worker/` | 작업 프로세스와 작업 종류별 처리기 |
| `scripts/spike/` | 일회성 확인 스크립트. 제품 코드가 쓰지 않는다 |
| `docs/` | 목표, 결정, 실험 기록 |
| `backlog/`, `specs/` | 작업 계획 (harness-kit) |
