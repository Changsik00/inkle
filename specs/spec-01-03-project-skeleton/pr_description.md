# feat(spec-01-03): 프로젝트 뼈대와 로컬 환경, ADR-004 가정 확인

## 📋 Summary

### 배경 및 목적

ADR-001 ~ 005 대로 이후 spec 이 올라설 실행 환경을 만들고, ADR-004 가 전제한 가정을 실제로 돌려 확인한다. 제품 기능은 없다.

### 주요 변경 사항
- [x] Next.js 뼈대 정리 (`@anthropic-ai/sdk` 와 기본 화면 제거), Vitest 와 `tsx` 추가
- [x] ADR-004 가정 확인: 웹 검색, 결과 형식, 본문 추출 통과. 컨테이너 안의 토큰 로그인은 확인하지 않음
- [x] `docker compose`: 웹 앱과 DB. 웹 앱이 뜰 때 마이그레이션 적용
- [x] 마이그레이션 실행기, 사용자와 작업 대기열 테이블, 로컬 사용자
- [x] 작업 대기열과 작업 프로세스 (`pnpm worker`, 호스트에서 실행)
- [x] 상태 확인 API (`/api/health`)와 첫 화면
- [x] 한국어 README
- [x] ADR 5개를 accepted 로, 작업 프로세스를 호스트에서 띄우도록 ADR-001, ADR-004 고침
- [x] `backlog/phase-01.md`: 프론트 구조를 spec-01-04 의 첫 작업(ADR-006)으로 추가

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: A 구간(기반)의 마지막 spec. 이 뒤로 제품 기능을 쌓는다.

## 🎯 Key Review Points

1. **작업 프로세스는 호스트에서 뜬다.** `CLAUDE_CODE_OAUTH_TOKEN` 을 비워 두고 이 기기의 CLI 로그인을 쓰기로 한 결과다. phase-01 성공 기준 6 을 "`docker compose up` 과 `pnpm worker`"로 고쳤다.
2. **DB 는 비밀번호 없이 접속하고 포트는 `127.0.0.1:54329` 에만 연다.** 로컬 전용이다.
3. **작업 대기열** (`src/domain/jobs.ts`): `FOR UPDATE SKIP LOCKED` 로 동시에 가져가도 겹치지 않는다. 재시도와 오래 멈춘 작업의 회수는 아직 없다.
4. **precheck 등록은 이 기기에만 남는다.** `.harness-kit/` 이 gitignore 되어 있다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait db
pnpm lint && pnpm typecheck && pnpm test
```

**결과 요약**:
- ✅ lint, 타입 검사 통과
- ✅ 테스트 19개 통과 (5 파일)

### 수동 검증 시나리오
1. **compose**: `docker compose up -d --wait` → 두 컨테이너 healthy, `/api/health` 가 200. DB 를 멈추면 503
2. **작업 처리**: `pnpm worker` 후 `pnpm job:enqueue noop` → `done`. 없는 종류는 `failed` 와 이유
3. **재시작**: `docker compose down` → `up` → 작업 기록과 로컬 사용자 유지
4. **비밀값**: 브랜치 diff 에 토큰·비밀번호 없음

## 📦 Files Changed

### 🆕 New Files
- `Dockerfile`, `.dockerignore`, `compose.yaml`, `docker/db-init/01-test-db.sql`, `.env.example`
- `src/db/`: 연결, 설정, 마이그레이션 실행기와 `migrations/0001_init.sql`, 테스트 도우미
- `src/domain/`: 상태 확인, 사용자, 작업 대기열과 각 테스트
- `src/worker/`: 작업 프로세스, 처리기 목록, 작업 넣기 명령
- `src/app/api/health/route.ts`, `src/app/health-status.tsx`, `src/product.ts`
- `scripts/spike/`: 가정 확인 스크립트 (일회성)
- `docs/experiments/02-cli-assumptions/README.md`: 가정 확인 결과
- 뼈대: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.mts`, `AGENTS.md`, `src/app/` 의 layout, page, css, favicon
- `specs/spec-01-03-project-skeleton/`

### 🛠 Modified Files
- `README.md`: 한국어 소개와 실행 방법
- `.gitignore`: `.env.example` 예외
- `docs/decisions/ADR-001 ~ 005`, `README.md`: accepted, 작업 프로세스 위치, 가정 확인 결과
- `backlog/phase-01.md`: 통합 시나리오 2, 성공 기준 6, spec-01-04 의 프론트 구조, 통합 테스트 명령, 결정 기록

## ✅ Definition of Done

- [x] ADR-004 의 가정 네 가지 확인 결과가 기록되어 있음 (가정 1 은 사용자 결정으로 확인하지 않음)
- [x] 모든 테스트 PASS, lint 와 타입 검사 통과
- [x] `docker compose up` 으로 웹 앱과 DB 가 뜨고 시험용 작업이 처리됨 (작업 프로세스는 호스트)
- [x] precheck 등록 (이 기기에만)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-03-project-skeleton/walkthrough.md`
- 가정 확인: `docs/experiments/02-cli-assumptions/README.md`
- ADR: `docs/decisions/README.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
