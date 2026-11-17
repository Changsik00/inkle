# refactor(spec-01-05): pnpm 워크스페이스 모노레포로 전환

## 📋 Summary

### 배경 및 목적

API 가 별도 서버가 되면서(ADR-009) 실행 단위가 셋(화면, API, 작업 프로세스)인데, 의존성·설정·이미지는 하나였다. "서버가 둘이면 앱이 둘"이라는 사용자 의견에 따라 코드가 적은 지금 모노레포로 옮긴다. 동작은 바꾸지 않는다.

### 주요 변경 사항
- [x] `apps/web`, `apps/api`, `apps/worker`, `packages/contract`, `packages/backend` (`@inkle/*`)
- [x] 영역 경계를 패키지 의존성으로. `tests/workspace.test.ts` 가 각 `package.json` 을 확인
- [x] 패키지 안의 가져오기는 상대 경로, 패키지는 TypeScript 소스를 그대로 내보냄
- [x] 루트 명령은 그대로 (`pnpm lint`, `typecheck`, `test`, `test:e2e`, `build`, `db:migrate`, `worker`, `job:enqueue`)
- [x] 루트 `vitest.config.mts` 의 프로젝트 넷, 루트 `eslint.config.mjs` 의 경로별 규칙
- [x] compose: 워크스페이스마다 `node_modules` 볼륨, `pnpm --filter` 시작 명령
- [x] ADR-010, ADR-008 대체, 아키텍처 문서·README 갱신

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: A 구간(기반). 이후 기능은 이 배치 위에 쌓는다.

## 🎯 Key Review Points

1. **대부분이 이동과 가져오기 경로 수정이다.** 실제로 새로 쓴 것은 각 `package.json`·`tsconfig.json`, `tests/workspace.test.ts`, 설정 파일, 마이그레이션 경로(파일 기준으로), 규칙 테스트의 분리다.
2. **처음 한 번 `docker compose up -d --wait --build -V`** 로 볼륨을 새로 만들어야 한다. DB 자료는 그대로 남는다.
3. **루트에 `next` 를 개발 의존성으로 둔다.** `eslint-config-next` 가 루트에서 찾기 때문이다.
4. **`.gitignore` 를 고쳤다.** `node_modules`, `.next` 등이 모든 워크스페이스에서 무시된다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait --build -V
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

**결과 요약**:
- ✅ lint, 타입 검사, 빌드
- ✅ Vitest 138개 (21 파일, 프로젝트 넷)
- ✅ Playwright 4개

### 수동 검증 시나리오
1. **compose**: web, api, db healthy, `/api/health` 200
2. **화면**: E2E 로 등록 흐름
3. **작업 프로세스와 명령**: `pnpm worker`, `pnpm job:enqueue noop`, `pnpm db:migrate`
4. **경계**: web 에서 backend 를 가져오면 타입 검사와 lint 가 막음
5. **재시작**: 자료 유지

## 📦 Files Changed

### 🆕 New Files
- `pnpm-workspace.yaml`, `tsconfig.base.json`, `tests/workspace.test.ts`
- `apps/{web,api,worker}/package.json`, `tsconfig.json`; `packages/{contract,backend}/package.json`, `tsconfig.json`
- `apps/web/src/architecture.test.ts` (화면 규칙), `docs/decisions/ADR-010-monorepo.md`

### 🔀 Moved
- `src/app`, `src/frontend/*`, `src/shared/product.ts`, `components.json`, `next.config.ts` → `apps/web/`
- `src/shared/contract` → `packages/contract/src`
- `src/backend/*` → `packages/backend/src/*` (서버 생성 포함), 진입점은 `apps/api/src`, `apps/worker/src`
- `src/architecture.test.ts` → `packages/backend/src/architecture.test.ts` (계층 규칙)

### 🛠 Modified Files
- 루트 `package.json`, `tsconfig.json`, `vitest.config.mts`, `eslint.config.mjs`, `Dockerfile`, `compose.yaml`, `.gitignore`, `.dockerignore`, `pnpm-lock.yaml`
- `packages/backend/src/infrastructure/db/migrate.ts` (마이그레이션 경로를 파일 기준으로)
- `docs/architecture.md`, `README.md`, `backlog/phase-01.md`, ADR-001·006·007·008·009

## ✅ Definition of Done

- [x] 대응표대로 옮기고 `src/` 가 없다
- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드 성공, E2E 통과
- [x] 수동 검증 시나리오 5개 확인
- [x] ADR-010, 문서 경로 갱신
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-05-monorepo/walkthrough.md`
- 아키텍처: `docs/architecture.md` §1, §2
- ADR: `docs/decisions/ADR-010-monorepo.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
