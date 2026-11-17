---
id: ADR-008
type: convention
date: 2026-11-17
status: accepted
---

# ADR-008: src 를 backend · frontend · shared 로 나누고, backend 와 frontend 는 서로 가져오지 않는다

## 📚 Context

- ADR-006 과 ADR-007 로 서버 계층(domain, application, infrastructure …)과 화면(features, ui, HTTP 클라이언트)이 생겼는데, 모두 `src` 바로 아래 같은 단에 있었다. 폴더 이름만 봐서는 어느 쪽 코드인지 알 수 없었다.
- 사용자 요청 (2026-11-17, PR #4 리뷰): `src` 아래에 섞인 백엔드와 프론트를 구분한다. 사용자가 "한 앱 안에서 나누기"(모노레포 아님)를 골랐다.
- Next.js 는 라우트 폴더를 `src/app` 에 두도록 정해 두었다. 이 폴더에는 화면 페이지와 HTTP API 의 입구(route 파일)가 함께 있다.
- 서버와 화면이 함께 쓰는 것은 HTTP 계약(oRPC, ADR-007 §3) 하나다.

## 🎯 Decision

```
src/
  app/        Next.js 라우트. 얕은 입구만 둔다
              - 페이지·레이아웃 → frontend 를 배치
              - api/ 의 route 파일 → backend 를 부름
  backend/    domain, application, infrastructure (ADR-006)
              rpc (계약 구현), container.ts (조립), worker, cli, testing
  frontend/   features, ui (shadcn/ui), api-client (HTTP 클라이언트), providers.tsx, testing
  shared/     contract (HTTP 계약), product.ts
```

| 영역 | 가져올 수 있는 것 | 가져올 수 없는 것 |
|---|---|---|
| `src/shared/` | 외부 라이브러리 (`zod`, `@orpc/contract`) | backend, frontend, app, React, Next.js, DB |
| `src/frontend/` | shared, React, Next.js | backend, DB |
| `src/backend/` | shared, DB | frontend, React, Next.js |
| `src/app/` (api 제외) | frontend, shared | backend, DB |
| `src/app/api/` | backend (조립과 rpc), shared | - |

- backend 안의 계층 규칙(ADR-006 §1)은 그대로다.
- 테스트 도우미도 영역을 따른다: 메모리 저장소와 저장소 계약은 `src/backend/testing/`, MSW 와 브라우저 렌더링 도우미는 `src/frontend/testing/`.
- 전체에 걸친 규칙 테스트(`src/architecture.test.ts`)만 `src` 바로 아래에 둔다.
- 위 규칙은 lint(`no-restricted-imports`)로 막고 `src/architecture.test.ts` 로 확인한다.

## 📊 Consequences

- **긍정**: 경로만 보고 서버 코드인지 화면 코드인지 안다. 화면 코드가 서버 코드를 가져오는 실수를 lint 가 폴더 단위로 막는다.
- **긍정**: 나중에 모노레포로 나눌 때 `src/backend/`, `src/frontend/`, `src/shared/` 를 그대로 패키지로 옮기면 된다.
- **부정**: 가져오기 경로가 한 단 길어진다 (`@/backend/application/books`).
- **부정**: 한 앱이라 빌드와 의존성은 여전히 하나다. 화면 번들에 서버 코드가 섞이지 않는 것은 lint 규칙과 Next.js 의 클라이언트 경계에 기대고 있다.
- **중립**: `src/app/` 은 Next.js 의 규칙이라 어느 영역에도 속하지 않는 입구로 둔다.

## 🔀 Alternatives

- **모노레포** (pnpm 워크스페이스: `apps/web`, `packages/backend`, `packages/contract`): 패키지 경계가 가장 강하다 — 비채택 이유: 빌드, tsconfig, 테스트, Dockerfile 설정이 크게 늘고 ADR-001(단일 앱)을 바꿔야 한다. 혼자 만드는 지금 규모에 과하다.
- **그대로 두기**: 이동이 없다 — 비채택 이유: 사용자 요청. 폴더만으로 영역을 알 수 없다.
- **`src/server`, `src/client` 이름**: 짧다 — 비채택 이유: Next.js 의 "서버 컴포넌트"와 이름이 겹친다. 페이지(서버 컴포넌트)는 frontend 에 속한다.

## 📌 Status

Accepted (2026-11-17, spec-01-04 계획 변경, 사용자 요청). ADR-006, ADR-007 의 경로는 이 배치로 고쳤다.

## 🔗 Related

- ADR-001 (단일 앱), ADR-006 (서버 계층), ADR-007 (프론트 구조)
- `docs/architecture.md`
