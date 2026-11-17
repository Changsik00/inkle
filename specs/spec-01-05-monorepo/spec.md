# spec-01-05: 모노레포 전환

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-01-05` |
| **Phase** | `phase-01` |
| **Branch** | `spec-01-05-monorepo` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-11-17 |
| **소유자** | Changsik00 |

## 배경 및 문제 정의

### 현재 상황

실행 단위가 셋이다: 화면(Next.js), API 서버(ADR-009), 작업 프로세스. 셋 모두 한 `package.json`, 한 `src` 에서 나온다. `src` 는 backend · frontend · shared 로 나뉘어 있고(ADR-008), 영역 경계는 lint 규칙과 그 규칙을 확인하는 테스트가 지킨다.

### 문제점

- 서버가 둘이면 앱이 둘이다 (사용자 의견, 2026-11-17). 그런데 의존성, 경로 별칭, 테스트 설정, 이미지가 모두 하나라 API 이미지에 화면 의존성이, 화면 쪽에 서버 의존성이 함께 있다.
- 영역 경계를 패키지가 아니라 lint 가 지킨다. 규칙이 길고, 규칙이 빠지면 경계가 조용히 무너진다.
- 코드가 책 등록 하나뿐인 지금이 옮기기 가장 싸다.

### 해결 방안

pnpm 워크스페이스로 `apps/web`, `apps/api`, `apps/worker`, `packages/contract`, `packages/backend` 로 나눈다. `docs/architecture.md` §2-0 의 대응표와 순서를 따른다. 동작은 바꾸지 않는다.

## 요구사항

1. **배치**: 아래 §핵심 전략의 대응표대로 옮긴다. 이력이 남도록 `git mv` 로 옮긴다.
2. **의존성**: 앱과 패키지마다 자기 `package.json` 에 쓰는 것만 둔다. 화면(`apps/web`)은 `@inkle/backend` 와 `postgres` 에 의존하지 않는다. `@inkle/contract` 는 `zod` 와 `@orpc/contract` 에만 의존한다.
3. **경계**: 영역 경계는 패키지 의존성이 지킨다. 저장소 수준 테스트가 각 `package.json` 의 의존성을 읽어 이 규칙을 확인한다. backend 안의 계층 규칙(ADR-006)과 화면 규칙(`fetch` 금지, `@shadcn/lint`)은 lint 로 남긴다.
4. **명령**: 저장소 루트에서 지금과 같은 이름으로 돈다: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm build`, `pnpm db:migrate`, `pnpm worker`, `pnpm job:enqueue`. 앱별 명령은 `pnpm --filter` 로 부른다.
5. **compose**: `docker compose up -d --wait` 로 web, api, db 가 뜨고 화면과 API 가 지금처럼 동작한다. 재시작 뒤 자료가 남는다.
6. **문서**: ADR-010 을 쓰고 ADR-008 을 대체로 표시한다. ADR-006·007·009, `docs/architecture.md`, README, `CLAUDE.md`(필요하면), `backlog/phase-01.md` 의 경로를 고친다.

## Out of Scope

- 앱별 운영 이미지와 배포 설정. 개발용 이미지 하나를 그대로 쓴다 (아래 전략)
- 화면의 정적 내보내기 (열린 질문, `docs/goals.md`)
- Turborepo 같은 작업 실행 도구
- 패키지를 빌드해 배포하는 것. 패키지는 TypeScript 소스를 그대로 내보낸다
- 동작과 화면의 변경

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **패키지 이름**: `@inkle/web`, `@inkle/api`, `@inkle/worker`, `@inkle/contract`, `@inkle/backend`.
> - [ ] **패키지 안의 가져오기는 상대 경로로 바꾼다.** 지금의 `@/backend/...` 별칭은 패키지 밖에서 소스를 읽을 때 가져오는 쪽의 설정으로 풀려 깨진다. 화면 앱(`apps/web`)만 자기 안에서 `@/` 별칭을 계속 쓴다.
> - [ ] **패키지는 빌드 없이 TypeScript 소스를 내보낸다** (`exports` 가 `.ts` 파일을 가리킴). Next.js(Turbopack)는 워크스페이스 패키지를 자동으로 컴파일하고, API 서버와 작업 프로세스는 `tsx` 로 돈다.
> - [ ] **개발용 이미지는 하나로 둔다.** 앱별 이미지는 배포 방식을 정할 때 만든다. compose 는 패키지마다 `node_modules` 를 이름 없는 볼륨으로 둔다.
> - [ ] **E2E 와 저장소 수준 테스트는 루트에 둔다** (`e2e/`, `tests/`). 셋 이상의 앱을 함께 확인하기 때문이다.
> - [ ] **`product.ts`(제품 이름)는 `apps/web` 으로 옮긴다.** 화면만 쓴다.

> [!WARNING]
> - [ ] 거의 모든 파일의 경로가 바뀐다. 리뷰는 "이동"과 "가져오기 경로 수정"이 대부분이다.
> - [ ] compose 의 `node_modules` 볼륨 구성이 바뀐다. 처음 한 번 `docker compose up --build -V` 로 볼륨을 새로 만들어야 한다 (README 에 적는다).
> - [ ] 이 기기에만 등록된 검사 명령(precheck)은 이름이 같아 그대로 쓴다.

## 핵심 전략

### 배치

```
inkle/
├─ apps/
│  ├─ web/        @inkle/web     Next.js 화면 (지금의 src/app, src/frontend/*, product.ts)
│  ├─ api/        @inkle/api     API 서버 진입점, db:migrate · job:enqueue 명령
│  └─ worker/     @inkle/worker  작업 프로세스 진입점
├─ packages/
│  ├─ contract/   @inkle/contract  HTTP 계약
│  └─ backend/    @inkle/backend   domain, application, infrastructure, rpc,
│                                  container, http-server, worker 처리기, testing
├─ e2e/           Playwright (web + api + db)
├─ tests/         저장소 수준 테스트 (패키지 의존성 규칙)
├─ docker/, Dockerfile, compose.yaml
└─ package.json (워크스페이스 루트), pnpm-workspace.yaml, tsconfig.base.json,
   vitest.config.mts (프로젝트 묶음), eslint.config.mjs, playwright.config.ts
```

### 대응표

| 지금 | 옮길 곳 |
|---|---|
| `src/app/` | `apps/web/src/app/` |
| `src/frontend/{features,ui,api-client,testing}/`, `src/frontend/providers.tsx` | `apps/web/src/{features,ui,api-client,testing}/`, `apps/web/src/providers.tsx` |
| `src/shared/product.ts` (+ 테스트) | `apps/web/src/product.ts` |
| `components.json`, `next.config.ts` | `apps/web/` |
| `src/shared/contract/` | `packages/contract/src/` |
| `src/backend/{domain,application,infrastructure,rpc,testing}/`, `container.ts` | `packages/backend/src/…` |
| `src/backend/server/http-server.ts` (+ 테스트) | `packages/backend/src/server/` (서버 생성은 패키지, 띄우는 것은 앱) |
| `src/backend/server/main.ts` | `apps/api/src/main.ts` |
| `src/backend/cli/` | `apps/api/src/cli/` |
| `src/backend/worker/handlers.ts` | `packages/backend/src/worker/handlers.ts` |
| `src/backend/worker/main.ts` | `apps/worker/src/main.ts` |
| `src/architecture.test.ts` | backend 계층·화면 규칙은 `packages/backend`, `apps/web` 의 테스트로 나누고, 영역 경계는 `tests/workspace.test.ts`(의존성 확인)로 대체 |

### 패키지가 내보내는 것

| 패키지 | `exports` | 쓰는 곳 |
|---|---|---|
| `@inkle/contract` | `.` (계약 묶음), `./books`, `./health` | web, backend |
| `@inkle/backend` | `./container`, `./server`, `./worker`, `./migrate`, `./application/jobs`, `./testing/*` (테스트 전용) | api, worker |

### 설정

| 무엇 | 방법 |
|---|---|
| TypeScript | 루트 `tsconfig.base.json` 을 각 패키지가 확장한다. `pnpm typecheck` 는 `pnpm -r typecheck` |
| 테스트 | 루트 `vitest.config.mts` 의 `projects` 가 각 패키지의 설정을 모은다 (backend: Node, web: Node + 브라우저, 루트 `tests/`: Node). `pnpm test` 는 루트에서 한 번에 |
| lint | 루트 `eslint.config.mjs` 하나. 경로별 규칙: `apps/web/**` 는 Next.js 규칙, `fetch` 금지, `@shadcn/lint`. `packages/backend/src/**` 는 계층 규칙. `packages/contract/**` 는 React·Next.js·DB 금지 |
| 경계 확인 | `tests/workspace.test.ts`: `apps/web` 은 `@inkle/backend`·`postgres` 를 의존하지 않는다, `packages/contract` 는 `zod`·`@orpc/contract` 만, `packages/backend` 는 React·Next.js·`apps/*` 를 의존하지 않는다 |
| compose | 저장소를 `/app` 에 마운트하고 루트와 각 패키지의 `node_modules`, `apps/web/.next` 를 이름 없는 볼륨으로 둔다. 시작 명령은 `pnpm --filter` |

### 순서 (`docs/architecture.md` §2-0)

1. 워크스페이스 뼈대와 `packages/contract`
2. `packages/backend`, `apps/api`, `apps/worker`
3. `apps/web`
4. 설정 (lint, 테스트, compose), 경계 테스트
5. 문서

각 단계마다 테스트가 돌도록 옮기되, 커밋은 아래 task 단위로 묶는다.

## Proposed Changes

#### [NEW] `pnpm-workspace.yaml`, `tsconfig.base.json`, `tests/workspace.test.ts`
#### [NEW] `apps/{web,api,worker}/package.json`, `tsconfig.json`, (web) `vitest.config.mts`
#### [NEW] `packages/{contract,backend}/package.json`, `tsconfig.json`, (backend) `vitest.config.mts`
#### [MOVE] `src/**` → `apps/*/src/**`, `packages/*/src/**` (대응표)
#### [MODIFY] 루트 `package.json` (워크스페이스 루트, 공통 명령), `vitest.config.mts`, `eslint.config.mjs`, `tsconfig.json`, `playwright.config.ts`, `compose.yaml`, `Dockerfile`, `.gitignore`, `.dockerignore`
#### [NEW] `docs/decisions/ADR-010-monorepo.md`
#### [MODIFY] `docs/decisions/ADR-006`, `007`, `008`, `009`, `docs/architecture.md`, `README.md`, `backlog/phase-01.md`
#### [DELETE] `src/` (비게 된 뒤)

## 검증 계획

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test:unit
docker compose up -d --wait --build -V
pnpm test && pnpm test:e2e && pnpm build
```

수동 검증 시나리오:
1. `docker compose up -d --wait --build -V` — 기대 결과: web, api, db 가 healthy. `/api/health` 가 web 을 거쳐 200.
2. 화면에서 책을 등록하고 목록과 책 정보를 본다 — 기대 결과: 전환 전과 같다.
3. `pnpm worker` 와 `pnpm job:enqueue noop` — 기대 결과: 작업이 처리된다.
4. `apps/web` 에서 `@inkle/backend` 를 가져오는 코드를 잠시 넣는다 — 기대 결과: 의존성에 없어 타입 검사가 실패하고, `tests/workspace.test.ts` 가 의존성 규칙을 확인한다. 되돌린다.
5. `docker compose down` 뒤 `up` — 기대 결과: 자료가 남아 있다.

## 롤백 계획

- `git revert`. compose 볼륨 구성이 바뀌므로 되돌린 뒤 `docker compose up --build -V` 로 볼륨을 새로 만든다. DB 볼륨(`db-data`)은 건드리지 않는다.

## ADR 후보

- [x] ADR 가치 있는 결정 있음 → `ADR-010-monorepo` (type: decision). ADR-008 을 대체한다.
- [ ] 없음

## ✅ Definition of Done

- [ ] 대응표대로 옮기고 `src/` 가 없다
- [ ] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드 성공, E2E 통과
- [ ] 수동 검증 시나리오 5개 확인
- [ ] ADR-010, 문서 경로 갱신
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-01-05-monorepo` 브랜치 push 완료
