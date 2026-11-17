---
id: ADR-008
type: convention
date: 2026-11-17
status: superseded
---

# ADR-008: src 를 backend · frontend · shared 로 나누고, backend 와 frontend 는 서로 가져오지 않는다

## 📚 Context

- ADR-006 과 ADR-007 로 서버 계층(domain, application, infrastructure …)과 화면(features, ui, HTTP 클라이언트)이 생겼는데, 모두 `src` 바로 아래 같은 단에 있었다. 폴더 이름만 봐서는 어느 쪽 코드인지 알 수 없었다.
- 사용자 요청 (2026-11-17, PR #4 리뷰): `src` 아래에 섞인 백엔드와 프론트를 구분한다. 사용자가 "한 앱 안에서 나누기"(모노레포 아님)를 골랐다.
- Next.js 는 라우트 폴더를 src/app 에 두도록 정해 두었다. 이 폴더에는 화면 페이지와 HTTP API 의 입구(route 파일)가 함께 있다.
- 서버와 화면이 함께 쓰는 것은 HTTP 계약(oRPC, ADR-007 §3) 하나다.

## 🎯 Decision

```
src/
  app/        Next.js 화면 라우트. 페이지·레이아웃은 frontend 를 배치하는 틀
              (API 는 별도 서버 — 처음에는 api/ route 파일이 있었다. ADR-009)
  backend/    domain, application, infrastructure (ADR-006)
              rpc (계약 구현), server (API 서버), container.ts (조립), worker, cli, testing
  frontend/   features, ui (shadcn/ui), api-client (HTTP 클라이언트), providers.tsx, testing
  shared/     contract (HTTP 계약), product.ts
```

| 영역 | 가져올 수 있는 것 | 가져올 수 없는 것 |
|---|---|---|
| src/shared/ | 외부 라이브러리 (`zod`, `@orpc/contract`) | backend, frontend, app, React, Next.js, DB |
| src/frontend/ | shared, React, Next.js | backend, DB |
| src/backend/ | shared, DB | frontend, React, Next.js |
| src/app/ | frontend, shared | backend, DB |

- backend 안의 계층 규칙(ADR-006 §1)은 그대로다.
- 테스트 도우미도 영역을 따른다: 메모리 저장소와 저장소 계약은 src/backend/testing/, MSW 와 브라우저 렌더링 도우미는 src/frontend/testing/.
- 전체에 걸친 규칙 테스트(src/architecture.test.ts)만 `src` 바로 아래에 둔다.
- 위 규칙은 lint(`no-restricted-imports`)로 막고 src/architecture.test.ts 로 확인한다.

## 📊 Consequences

- **긍정**: 경로만 보고 서버 코드인지 화면 코드인지 안다. 화면 코드가 서버 코드를 가져오는 실수를 lint 가 폴더 단위로 막는다.
- **긍정**: 나중에 모노레포로 나눌 때 src/backend/, src/frontend/, src/shared/ 를 그대로 패키지로 옮기면 된다.
- **부정**: 가져오기 경로가 한 단 길어진다 (`@/backend/application/books`).
- **부정**: 한 앱이라 빌드와 의존성은 여전히 하나다. 화면 번들에 서버 코드가 섞이지 않는 것은 lint 규칙과 Next.js 의 클라이언트 경계에 기대고 있다.
- **중립**: src/app/ 은 Next.js 의 규칙이라 어느 영역에도 속하지 않는 입구로 둔다.

## 🔁 다시 볼 때: 배포 방식을 정할 때

사용자 의견 (2026-11-17): 지금은 Next.js 한 서버가 화면과 API 를 함께 낸다. 배포할 때는 화면을 정적(SSG)으로 내고 API 를 따로 두는 모노레포가 나을 수 있다. 배포 방식을 정할 때 이 ADR 을 다시 본다.

→ 이어서 API 를 별도 서버로 나누면서(ADR-009) 모노레포 전환을 앞당기기로 했다 (spec-01-05). 정적 배포 여부는 여전히 열려 있다.

**지금의 상태**

- 배포 단위는 화면(Next.js)과 API 서버 둘이다 (ADR-009 이후). 화면은 Next.js 서버가 낸다.
- 다만 화면은 이미 정적에 가깝다. 페이지는 자료를 읽지 않는 틀이라 빌드 때 미리 그려지고(빌드 결과의 `○`), 자료는 브라우저가 HTTP API 로 가져온다 (ADR-001 §4, ADR-007 §1). 서버에서 자료를 넣어 그리는(SSR) 화면은 없다.
- 그래서 화면과 서버가 묶여 있는 곳은 렌더링이 아니라 배포다: 같은 서버, 같은 주소의 `/api`, 서버가 처리하는 동적 주소(`/books/{bookId}`).

**나누면 얻는 것**

- 화면을 CDN 에 정적 파일로 두고, 서버는 API 만 운영한다. 비용, 확장, 배포를 따로 다룬다.
- 모바일 클라이언트가 같은 API 를 쓴다 (ADR-001 의 모바일 가정).

**나눌 때 할 일** (자세한 대응표와 순서는 `docs/architecture.md` §모노레포로 옮길 때)

| 할 일 | 내용 |
|---|---|
| 패키지 | apps/web (화면), apps/api (지금의 src/backend/server/, ADR-009 로 이미 따로 뜬다), packages/contract (지금의 shared), packages/backend |
| 동적 주소 | 정적 내보내기에서는 주소마다 미리 그릴 값이 필요하다. 책 정보처럼 값이 정해지지 않은 주소는 클라이언트 라우팅이나 SPA 폴백으로 바꾼다 |
| API 주소 | 화면과 API 의 주소가 달라지면 CORS 를 열고, HTTP 클라이언트의 기본 주소(`origin` 옵션, 이미 있음)를 설정한다 |
| 인증 | 쿠키를 쓴다면 도메인과 SameSite 설정을 정한다 (인증은 아직 없다) |

**나중을 쉽게 하려고 지금 지키는 것**

- 페이지에서 서버 자료를 읽지 않는다 (ADR-007 §1). 서버 컴포넌트에서 `headers()`, `cookies()` 같은 요청 시점의 API 를 쓰지 않는다.
- Server Actions 를 쓰지 않는다 (ADR-007 §3).
- frontend 와 backend 는 서로 가져오지 않는다 (이 ADR, lint 로 강제).
- API 주소는 HTTP 클라이언트(src/frontend/api-client/) 한 곳에서만 정한다.

이 넷 가운데 하나라도 깨야 하는 기능이 생기면, 그 spec 에서 이 절을 먼저 다시 본다.

## 🔀 Alternatives

- **모노레포** (pnpm 워크스페이스: `apps/web`, `packages/backend`, `packages/contract`): 패키지 경계가 가장 강하다 — 비채택 이유: 빌드, tsconfig, 테스트, Dockerfile 설정이 크게 늘고 ADR-001(단일 앱)을 바꿔야 한다. 혼자 만드는 지금 규모에 과하다.
- **그대로 두기**: 이동이 없다 — 비채택 이유: 사용자 요청. 폴더만으로 영역을 알 수 없다.
- **src/server, src/client 이름**: 짧다 — 비채택 이유: Next.js 의 "서버 컴포넌트"와 이름이 겹친다. 페이지(서버 컴포넌트)는 frontend 에 속한다.

## 📌 Status

**Superseded by ADR-010 (2026-11-18).** 모노레포로 옮겼다. 아래 경로는 당시의 기록이다.

대체 예정 (2026-11-17): 모노레포로 옮기기로 했다 (사용자 결정). spec-01-05 에서 ADR-010 이 이 배치를 대체한다. 그 전까지는 이 배치를 따른다.

고침 (2026-11-17): src/app/api 는 없어졌다. API 는 src/backend/server/ 의 별도 서버다 (ADR-009).


Accepted (2026-11-17, spec-01-04 계획 변경, 사용자 요청). ADR-006, ADR-007 의 경로는 이 배치로 고쳤다.

## 🔗 Related

- ADR-001 (단일 앱), ADR-006 (서버 계층), ADR-007 (프론트 구조)
- `docs/architecture.md`
