---
id: ADR-010
type: decision
date: 2026-11-18
status: accepted
---

# ADR-010: pnpm 워크스페이스 모노레포로 나누고, 영역 경계는 패키지 의존성이 지킨다

## 📚 Context

- ADR-009 로 API 가 Next.js 와 다른 서버가 되어 실행 단위가 셋(화면, API, 작업 프로세스)이 됐다. 그런데 의존성, 경로 별칭, 테스트 설정, 이미지가 모두 하나였다.
- 사용자 의견 (2026-11-17): "서버가 두 개 뜬다면 앱이 두 개인 건데, 이럴 거면 모노레포가 낫지 않나". 사용자가 지금 옮기기로 결정했다.
- ADR-008 은 `src` 안에서 backend · frontend · shared 로 나누고 경계를 lint 로 지켰다. 규칙이 길고, 빠지면 경계가 조용히 무너진다.
- 이 판의 Next.js(Turbopack)는 `pnpm-lock.yaml` 로 워크스페이스 루트를 찾고 워크스페이스 패키지를 자동으로 컴파일한다 (번들 문서 `turbopack`, `transpilePackages`).

## 🎯 Decision

```
apps/
  web/        @inkle/web       Next.js 화면
  api/        @inkle/api       API 서버 진입점, db:migrate · job:enqueue
  worker/     @inkle/worker    작업 프로세스 진입점
packages/
  contract/   @inkle/contract  HTTP 계약
  backend/    @inkle/backend   domain, application, infrastructure, rpc, 조립, 서버 생성, 작업 처리기
e2e/, tests/                   여러 앱을 함께 보는 테스트
```

1. **pnpm 워크스페이스만 쓴다.** Turborepo 같은 작업 실행 도구는 넣지 않는다.
2. **패키지는 빌드 없이 TypeScript 소스를 내보낸다** (`exports` 가 `.ts` 를 가리킴). 화면은 Next.js 가, API 와 작업 프로세스는 `tsx` 가 바로 읽는다.
3. **패키지 안의 가져오기는 상대 경로**다. 별칭(@/ 로 시작하는 경로)은 화면 앱 안에서만 쓴다. 별칭은 다른 패키지가 소스를 읽을 때 가져오는 쪽 설정으로 풀려 깨지기 때문이다.
4. **영역 경계는 패키지 의존성이 지킨다.** `package.json` 에 없는 패키지는 가져올 수 없다. 규칙: web 은 backend 와 DB 에 의존하지 않는다, contract 는 `zod` 와 `@orpc/contract` 에만, backend 와 api · worker 는 React · Next.js · web 에 의존하지 않는다. `tests/workspace.test.ts` 가 각 `package.json` 을 읽어 확인한다.
5. **lint 는 루트 설정 하나**로, 패키지 안쪽 규칙만 둔다: backend 의 계층(ADR-006), 화면의 HTTP 호출과 UI 일관성(ADR-007), 계약의 금지 목록. 같은 실수를 타입 검사보다 읽기 쉬운 메시지로 알리려고 "web 은 backend 금지"도 lint 에 남긴다.
6. **명령은 루트에서** 지금과 같은 이름으로 돈다 (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm db:migrate`, `pnpm worker`, `pnpm job:enqueue`). 테스트는 루트 `vitest.config.mts` 의 프로젝트 넷(backend, web, web-browser, workspace)을 한 번에 돈다.
7. **개발용 이미지는 하나**로 web, api, worker 가 함께 쓴다. compose 는 워크스페이스마다 `node_modules` 를 이름 없는 볼륨으로 둔다. 앱별 운영 이미지는 배포 방식을 정할 때 만든다.

이 결정이 ADR-008 을 대체한다. ADR-006(서버 계층), ADR-007(프론트 구조), ADR-009(별도 API 서버)는 그대로이며 경로만 바뀌었다.

## 📊 Consequences

- **긍정**: 경계를 패키지가 지킨다. web 에서 backend 를 가져오면 타입 검사가 먼저 실패한다.
- **긍정**: 앱마다 쓰는 의존성만 보인다. 화면을 정적으로 배포하거나 앱별 이미지를 만들 때 나눌 것이 이미 나뉘어 있다.
- **부정**: 설정 파일이 늘었다 (패키지마다 `package.json`, `tsconfig.json`). 루트에 lint 용으로 `next` 를 개발 의존성으로 둔다 (`eslint-config-next` 가 루트에서 `next` 를 찾는다).
- **부정**: compose 의 볼륨이 워크스페이스 수만큼 늘었다. 의존성이 바뀌면 `docker compose up --build -V` 로 볼륨을 새로 만들어야 한다.
- **부정**: 패키지가 소스를 그대로 내보내므로, 화면 앱이 아닌 곳에서 패키지를 쓰려면 TypeScript 를 읽을 수 있어야 한다 (`tsx`, Vitest, Next.js 는 된다).
- **중립**: `.gitignore` 의 `node_modules`, `.next` 를 모든 워크스페이스에 맞게 고쳤다.

## 🔀 Alternatives

- **ADR-008 유지** (`src` 안의 영역): 설정이 하나다 — 비채택 이유: 사용자 결정. 실행 단위가 셋이면 앱이 셋이다.
- **Turborepo / Nx**: 작업 캐시와 순서 관리 — 비채택 이유: 앱이 셋뿐이고 빌드할 패키지가 없어 이득이 작다.
- **패키지를 빌드해 내보내기** (`dist`): 소비하는 쪽이 TypeScript 를 몰라도 된다 — 비채택 이유: 빌드 단계와 감시가 늘어난다. 지금 소비하는 쪽은 모두 TypeScript 를 읽는다.
- **package.json `imports` 별칭** (`#backend/*`): 패키지 안에서 별칭을 유지한다 — 비채택 이유: Next.js, `tsx`, Vitest 가 모두 같은 방식으로 풀어 주는지 확인 비용이 크다. 상대 경로가 가장 확실하다.

## 📌 Status

Accepted (2026-11-18, spec-01-05, 사용자 결정). ADR-008 을 대체한다.

## 🔗 Related

- ADR-006, ADR-007, ADR-008 (대체됨), ADR-009
- `docs/architecture.md` §2
