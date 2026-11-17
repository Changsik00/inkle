# Task List: spec-01-05

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> 동작을 바꾸지 않는 이동이라, 각 task 의 "테스트"는 기존 테스트가 새 자리에서 그대로 도는 것과 새 경계 테스트입니다.

---

## Task 1: 계획 문서

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-05-monorepo`

### 1-2. 문서
- [x] `spec.md`, `task.md`, sdd 자동 갱신분
- [x] Commit: `docs(spec-01-05): add spec and task for monorepo migration`

---

## Task 2: 경계 테스트와 워크스페이스 뼈대

### 2-1. 테스트 작성 (TDD Red)
- [ ] `tests/workspace.test.ts`: 워크스페이스에 다섯 패키지가 있고, web 은 backend·postgres 를 의존하지 않고, contract 는 zod·@orpc/contract 만, backend 는 React·Next.js·apps 를 의존하지 않는다
- [ ] 테스트 실행 → Fail 확인

### 2-2. 구현 (TDD Green)
- [ ] `pnpm-workspace.yaml`, `tsconfig.base.json`, 다섯 패키지의 `package.json` 과 `tsconfig.json`
- [ ] 테스트 실행 → Pass 확인 (아직 코드는 옮기지 않음)
- [ ] Commit: `chore(spec-01-05): add workspace skeleton and dependency boundary test`

---

## Task 3: 코드 옮기기

### 3-1. 이동
- [ ] 대응표대로 `git mv`. 패키지 안의 가져오기를 상대 경로로, 패키지 사이는 `@inkle/contract`, `@inkle/backend` 로
- [ ] 의존성을 각 `package.json` 으로 나누고 루트에는 공통 개발 도구만
- [ ] 설정: 루트 `vitest.config.mts`(projects), 각 패키지의 Vitest 설정, `eslint.config.mjs`(경로별 규칙), `playwright.config.ts`, `apps/web/next.config.ts`·`components.json`, 마이그레이션 경로, MSW 워커 위치
- [ ] 규칙 테스트를 나눈다: backend 계층(`packages/backend`), 화면 규칙(`apps/web`)
- [ ] 루트 명령 (`lint`, `typecheck`, `test`, `test:unit`, `test:e2e`, `build`, `db:migrate`, `worker`, `job:enqueue`)

### 3-2. 확인
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` 통과
- [ ] Commit: `refactor(spec-01-05): move code into apps and packages`

---

## Task 4: compose 와 이미지

- [ ] `Dockerfile` (워크스페이스 설치), `compose.yaml` (패키지별 `node_modules` 볼륨, `pnpm --filter` 시작 명령), `.dockerignore`
- [ ] `docker compose up -d --wait --build -V`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, 수동 검증 1~5
- [ ] Commit: `chore(spec-01-05): run compose services from workspace apps`

---

## Task 5: 문서

- [ ] `docs/decisions/ADR-010-monorepo.md`, ADR-008 대체 표시, ADR-006·007·009 경로
- [ ] `docs/architecture.md` (§1 실행 단위, §2 구조를 모노레포 기준으로, §2-0 은 완료 기록으로), `README.md`, `backlog/phase-01.md`
- [ ] Commit: `docs(spec-01-05): document monorepo layout`

---

## Task 6: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS (`pnpm test`, `pnpm test:e2e`)
- [ ] lint, 타입 검사, 빌드

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-05): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-05-monorepo`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
