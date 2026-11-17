# Walkthrough: spec-01-05

> 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 작업 실행 도구 | Turborepo, Nx / pnpm 워크스페이스만 | pnpm 워크스페이스만 | 앱 셋, 빌드할 패키지 없음 |
| 패키지 내보내기 | 빌드한 `dist` / TypeScript 소스 | 소스 (`exports` → `.ts`) | 소비하는 쪽(Next.js, tsx, Vitest)이 모두 TypeScript 를 읽는다 |
| 패키지 안의 가져오기 | `@/` 별칭 / `package.json` imports / 상대 경로 | 상대 경로 | 별칭은 다른 패키지가 소스를 읽을 때 깨진다. imports 는 도구마다 확인 비용이 크다 |
| 영역 경계 | lint / 패키지 의존성 | 패키지 의존성 + `tests/workspace.test.ts` | `package.json` 에 없으면 가져올 수 없다. web → backend 는 lint 메시지로도 남겼다 |
| 서버 생성의 자리 | `apps/api` / `packages/backend` | `packages/backend/src/server/` (띄우는 것은 `apps/api`) | 실제 HTTP 서버 테스트를 backend 테스트와 함께 돌린다 |
| 마이그레이션 경로 | 작업 디렉토리 기준 / 파일 기준 | 파일 기준 (`import.meta.url`) | 어느 앱에서 불러도 같은 폴더를 가리킨다 |
| lint 설정 | 패키지마다 / 루트 하나 | 루트 하나, 경로별 규칙 | 규칙이 패키지 사이에 걸쳐 있다. `eslint-config-next` 때문에 루트에 `next` 를 개발 의존성으로 둔다 |
| Vitest | 패키지마다 설정 파일 / 루트 하나의 프로젝트 넷 | 루트 하나 | 웹은 Node 와 브라우저 두 프로젝트가 필요해 한곳에서 보는 편이 읽기 쉽다 |
| 이미지 | 앱별 / 하나 | 하나 (개발용) | 앱별 이미지는 배포 방식을 정할 때 |
| `product.ts` | contract / web | `apps/web/src/` | 화면만 쓴다 |

새 ADR: ADR-010 (모노레포). ADR-008 은 대체됨으로 표시했다.

## 💬 사용자 협의

- **주제**: 모노레포로 갈 것인가 (PR #4 리뷰)
  - **합의**: "서버가 두 개면 앱이 두 개다"는 사용자 의견에 동의했다. PR #4 는 그대로 병합하고 이 spec 에서 옮겼다.
- **주제**: 전환 범위 (Plan Accept)
  - **합의**: 패키지 이름 `@inkle/*`, 상대 경로, 소스 내보내기, 개발용 이미지 하나, 루트의 `e2e/`·`tests/`.

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`
- **결과**: ✅ Passed
```text
 Test Files  21 passed (21)
      Tests  138 passed (138)
  4 passed (Playwright)
```

### 수동 검증
1. **compose**: `docker compose up -d --wait --build -V` → web, api, db healthy. `/api/health` 가 web 을 거쳐 200.
2. **화면**: E2E 가 등록 → 책 정보 → 목록, 같은 책 재등록 안내를 확인.
3. **작업 프로세스**: `pnpm worker` 와 `pnpm job:enqueue noop` → 작업 6 처리. `pnpm db:migrate` → "적용할 마이그레이션 없음".
4. **경계**: `apps/web` 에 `@inkle/backend/container` 를 가져오는 파일을 잠시 넣었다 → 타입 검사가 "Cannot find module", lint 가 `no-restricted-imports` 로 막았다. 지웠다.
5. **재시작**: 책을 등록하고 `docker compose down` → `up` 뒤에도 남아 있었다.

## 🔍 발견 사항

- **Task 2 커밋이 워크스페이스의 `node_modules` 를 담았다.** `.gitignore` 의 `/node_modules` 가 루트만 가리켰다. 푸시 전에 알아채 Task 2 커밋을 다시 만들었고(`8f8cf4b`), `.gitignore` 를 모든 워크스페이스에 맞게 고쳤다.
- **`eslint-config-next` 는 루트에서 `next` 를 찾는다.** 루트에 개발 의존성으로 두었다. React 판도 루트에서 찾지 못해 lint 설정에 직접 적었다.
- **`res.json()` 의 타입이 `unknown` 이 되었다.** backend 패키지가 DOM 타입을 쓰지 않게 되면서 생긴 일이라 테스트에서 타입을 적었다.
- **커밋 훅의 lint 단계가 삭제·이동한 파일에서 오류를 낸다** (이전 spec 과 같음). 커밋은 통과한다.
- **이 기기의 precheck 명령**은 이름이 같아 그대로 쓴다.

## 🚧 이월 항목

- 앱별 운영 이미지, 화면 정적 배포 → 배포 방식을 정할 때 (`docs/architecture.md` §2-0)
- 디자인 시스템 (DESIGN.md, 여백의 노트) → spec-01-06
