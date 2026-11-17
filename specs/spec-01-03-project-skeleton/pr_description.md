# feat(spec-01-03): 프로젝트 뼈대와 로컬 환경, 서버 계층 구조, ADR-004 가정 확인

## 📋 Summary

### 배경 및 목적

ADR-001 ~ 005 대로 이후 spec 이 올라설 실행 환경을 만들고, ADR-004 가 전제한 가정을 실제로 돌려 확인한다. 리뷰 요청에 따라 서버 코드를 세 계층과 저장소 패턴으로 나눴다 (ADR-006). 제품 기능은 없다.

### 주요 변경 사항
- [x] Next.js 뼈대 정리 (`@anthropic-ai/sdk` 와 기본 화면 제거), Vitest 와 `tsx` 추가
- [x] ADR-004 가정 확인: 웹 검색, 결과 형식, 본문 추출 통과. 컨테이너 안의 토큰 로그인은 확인하지 않음
- [x] `docker compose`: 웹 앱과 DB. 웹 앱이 뜰 때 마이그레이션 적용
- [x] 마이그레이션 실행기, 사용자와 작업 대기열 테이블, 로컬 사용자
- [x] 작업 대기열과 작업 프로세스 (`pnpm worker`, 호스트에서 실행)
- [x] 상태 확인 API (`/api/health`)와 첫 화면
- [x] **서버 계층 구조 (리뷰 반영)**: `domain` ← `application`(유스케이스, 포트) ← `infrastructure`(Postgres 저장소), 조립은 `src/server/container.ts`. 의존 규칙을 lint 로 막고 테스트로 확인
- [x] **테스트 재구성**: 유스케이스는 메모리 저장소로 DB 없이, 같은 저장소 계약 테스트를 메모리와 Postgres 양쪽에
- [x] 아키텍처 문서 `docs/architecture.md`, ADR-006 서버 구조
- [x] 한국어 README
- [x] ADR 5개를 accepted 로, 작업 프로세스를 호스트에서 띄우도록 ADR-001, ADR-004 고침
- [x] `backlog/phase-01.md`: 프론트 구조를 spec-01-04 의 첫 작업(ADR-006)으로 추가

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: A 구간(기반)의 마지막 spec. 이 뒤로 제품 기능을 쌓는다.

## 🎯 Key Review Points

1. **서버 계층과 저장소 (ADR-006).** SQL 은 `src/infrastructure/repositories/` 에만 있다. 유스케이스는 포트(`src/application/ports.ts`)를 인자로 받는 함수다. 메모리 저장소는 계약 테스트로 실제 DB 와 같게 붙잡아 둔다.
2. **작업 프로세스는 호스트에서 뜬다.** `CLAUDE_CODE_OAUTH_TOKEN` 을 비워 두고 이 기기의 CLI 로그인을 쓰기로 한 결과다. phase-01 성공 기준 6 을 "`docker compose up` 과 `pnpm worker`"로 고쳤다.
3. **DB 는 비밀번호 없이 접속하고 포트는 `127.0.0.1:54329` 에만 연다.** 로컬 전용이다.
4. **작업 대기열** (`src/infrastructure/repositories/postgres-job-repository.ts`): `FOR UPDATE SKIP LOCKED` 로 동시에 가져가도 겹치지 않는다. 재시도와 오래 멈춘 작업의 회수는 아직 없다.
5. **precheck 등록은 이 기기에만 남는다.** `.harness-kit/` 이 gitignore 되어 있다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait db
pnpm lint && pnpm typecheck && pnpm test
```

**결과 요약**:
- ✅ lint, 타입 검사 통과
- ✅ 테스트 57개 통과 (8 파일)
- ✅ DB 를 멈춘 상태에서 `pnpm test:unit` 40개 통과

### 수동 검증 시나리오
1. **compose**: `docker compose up -d --wait` → 두 컨테이너 healthy, `/api/health` 가 200. DB 를 멈추면 503
2. **작업 처리**: `pnpm worker` 후 `pnpm job:enqueue noop` → `done`. 없는 종류는 `failed` 와 이유
3. **재시작**: `docker compose down` → `up` → 작업 기록과 로컬 사용자 유지
4. **비밀값**: 브랜치 diff 에 토큰·비밀번호 없음

## 📦 Files Changed

### 🆕 New Files
- `Dockerfile`, `.dockerignore`, `compose.yaml`, `docker/db-init/01-test-db.sql`, `.env.example`
- `src/domain/`: 작업과 사용자 타입
- `src/application/`: 포트, 유스케이스(상태 확인, 지금 사용자, 작업)와 테스트
- `src/infrastructure/`: DB 연결, 마이그레이션 실행기와 `migrations/0001_init.sql`, Postgres 저장소와 테스트
- `src/server/container.ts`: 조립
- `src/worker/`, `src/cli/`: 작업 프로세스, 처리기 목록, `db:migrate`, `job:enqueue`
- `src/testing/`: 메모리 저장소, 저장소 계약 테스트, 테스트 DB 도우미
- `src/architecture.test.ts`: 의존 규칙 테스트
- `docs/architecture.md`, `docs/decisions/ADR-006-server-structure.md`
- `src/app/api/health/route.ts`, `src/app/health-status.tsx`, `src/product.ts`
- `scripts/spike/`: 가정 확인 스크립트 (일회성)
- `docs/experiments/02-cli-assumptions/README.md`: 가정 확인 결과
- 뼈대: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.mts`, `AGENTS.md`, `src/app/` 의 layout, page, css, favicon
- `specs/spec-01-03-project-skeleton/`

### 🛠 Modified Files
- `README.md`: 한국어 소개와 실행 방법
- `.gitignore`: `.env.example` 예외
- `docs/decisions/ADR-001 ~ 005`, `README.md`: accepted, 작업 프로세스 위치, 가정 확인 결과
- `eslint.config.mjs`: 계층의 의존 규칙
- `docs/goals.md`: 아키텍처 문서 경로
- `backlog/phase-01.md`: 통합 시나리오 2, 성공 기준 6, spec-01-04 의 프론트 구조(ADR-007), 통합 테스트 명령, 결정 기록

## ✅ Definition of Done

- [x] ADR-004 의 가정 네 가지 확인 결과가 기록되어 있음 (가정 1 은 사용자 결정으로 확인하지 않음)
- [x] 모든 테스트 PASS, lint 와 타입 검사 통과
- [x] `docker compose up` 으로 웹 앱과 DB 가 뜨고 시험용 작업이 처리됨 (작업 프로세스는 호스트)
- [x] precheck 등록 (이 기기에만)
- [x] 서버 계층과 저장소, 아키텍처 문서 (계획 변경 2)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-03-project-skeleton/walkthrough.md`
- 가정 확인: `docs/experiments/02-cli-assumptions/README.md`
- 아키텍처: `docs/architecture.md`
- ADR: `docs/decisions/README.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
