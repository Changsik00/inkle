---
id: ADR-009
type: decision
date: 2026-11-17
status: accepted
---

# ADR-009: API 는 Next.js 와 다른 서버로 띄우고, Next.js 는 화면만 낸다

## 📚 Context

- ADR-001 은 Next.js 한 앱이 화면과 HTTP API 를 함께 내도록 정했다. API 의 입구는 src/app/api 아래의 route 파일이었다.
- ADR-008 로 `src` 를 backend · frontend · shared 로 나눈 뒤에도 `src/app/api` 가 backend 처럼 보여 헷갈렸다 (사용자 의견, 2026-11-17, PR #4 리뷰). 사용자가 "API 를 별도 서버로"를 골랐다.
- 배포 때 화면을 정적으로 내고 API 를 따로 두는 모노레포가 나을 수 있다는 의견이 이미 기록되어 있다 (ADR-008 §다시 볼 때).
- 계약 구현(oRPC)은 프레임워크와 무관하다. oRPC 는 Node 의 `http` 서버용 처리기를 제공한다.

## 🎯 Decision

1. **API 서버**: `src/backend/server/` 가 Node `http` 서버를 띄우고 oRPC 의 `OpenAPIHandler`(Node 판)로 계약의 주소를 처리한다. 엔드포인트 문서(주소 /api/openapi.json)도 여기서 낸다. 진입점은 `pnpm api`.
2. **Next.js 는 화면만 낸다.** `src/app/` 에는 화면 라우트만 있다. 브라우저는 지금처럼 같은 주소의 `/api` 를 부르고, Next.js 가 `rewrites` 로 API 서버에 넘긴다 (`next.config.ts`, 주소는 `API_ORIGIN`). 화면 코드와 HTTP 클라이언트는 API 가 다른 서버라는 것을 모른다.
3. **compose 는 `web`, `api`, `db` 셋이다.** 마이그레이션은 `api` 가 뜰 때 적용한다. `web` 은 DB 에 닿지 않는다. 작업 프로세스는 그대로 호스트에서 뜬다 (ADR-004).
4. **실행 단위는 넷이다**: 화면(web), API(api), 작업 프로세스(worker), DB. 앞의 셋은 같은 저장소, 같은 이미지에서 시작 명령만 다르다.

ADR-001 의 §1(단일 웹 앱)과 §2(컨테이너 셋)를 이 결정이 대체한다. 언어, 저장소, 대기열(ADR-001 §3), 자료 접근의 경계(§4), 모바일 가정(§5)은 그대로다.

## 📊 Consequences

- **긍정**: `src/app` 은 화면만, `src/backend` 는 서버 전부라 폴더의 뜻이 한 가지다.
- **긍정**: API 를 Next.js 없이 띄우고 테스트한다. API 처리 테스트가 실제 HTTP 서버를 부른다.
- **긍정**: 배포 때 화면을 정적으로 내고 API 서버만 운영하는 모양에 가까워졌다. 모노레포로 나눌 때 할 일이 줄었다 (`docs/architecture.md` §모노레포로 옮길 때).
- **부정**: 컨테이너가 하나 늘고, 개발 중 요청이 Next.js 를 한 번 더 거친다.
- **부정**: 화면과 API 의 배포가 맞물려야 한다. 계약이 바뀌면 두 서버를 함께 다시 띄운다 (지금은 같은 저장소라 함께 바뀐다).
- **중립**: 같은 주소의 `/api` 를 쓰므로 CORS 는 아직 필요 없다. 화면을 다른 주소에 정적으로 둘 때 필요해진다.

## 🔀 Alternatives

- **Next.js route 파일을 입구로 유지** (src/app/api/[...rest]/route.ts, 지금은 없음): 서버가 하나다 — 비채택 이유: 사용자 의견. `src/app` 이 화면과 서버를 함께 담아 헷갈린다.
- **라우팅 폴더를 루트 app 폴더로 옮기기**: `src` 에는 코드만 남는다 — 비채택 이유: API 의 입구가 여전히 Next.js 안에 있어 배포 분리에 가까워지지 않는다.
- **라우트 그룹으로 이름만 나누기** (src/app/(web), src/app/api): 변경이 가장 작다 — 비채택 이유: 헷갈림이 남는다.
- **Hono, Fastify 같은 서버 프레임워크**: 미들웨어가 갖춰져 있다 — 비채택 이유: 지금 필요한 것은 계약 처리와 문서 하나뿐이라 Node `http` 와 oRPC 처리기로 충분하다. 인증 등이 생기면 다시 본다.

## 📌 Status

Accepted (2026-11-17, spec-01-04 계획 변경 2, 사용자 결정).

## 🔗 Related

- ADR-001 (대체되는 부분: §1, §2), ADR-007 §3, ADR-008
- `docs/architecture.md`
