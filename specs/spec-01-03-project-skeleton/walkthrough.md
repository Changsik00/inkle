# Walkthrough: spec-01-03

> 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| CLI 로그인 방식 | 구독 토큰을 컨테이너에 전달 / 이 기기의 로그인 사용 | 이 기기의 로그인, 작업 프로세스는 호스트에서 실행 | 사용자 결정 (Task 3 도중). ADR-004 가 적어 둔 대안. ADR-001, ADR-004, phase-01 성공 기준 6 에 반영 |
| ORM | Drizzle / 쓰지 않음 | 쓰지 않음. `postgres` 로 SQL 을 쓰고 행은 `zod` 로 검사 | spec 에서 제안한 대로. 테이블이 적고, 대기열처럼 SQL 을 정확히 써야 하는 곳이 있다 |
| 마이그레이션 | 도구 / 번호 붙은 SQL 과 작은 실행기 | 직접 만든 실행기 (`src/db/migrate.ts`) | 한 트랜잭션 안에서 잠금을 잡아 동시 실행에도 한 번만 적용된다. 되돌리기(down)는 만들지 않았다 |
| 테스트 실행기 | Vitest / Jest | Vitest | spec 에서 제안한 대로. 이 판의 Next.js 문서가 안내하는 실행기 |
| 테스트 DB | 별도 컨테이너 / 같은 Postgres 의 다른 데이터베이스 | `inkle_test` 데이터베이스 | DB 볼륨을 처음 만들 때 `docker/db-init/` 이 만든다. 테스트 파일은 하나씩 돈다 (같은 DB 를 비우고 채우므로) |
| DB 접속 | 비밀번호 / 비밀번호 없이 (trust) | 비밀번호 없이, 포트는 `127.0.0.1` 에만 | 커밋 훅이 예시 비밀번호 값을 시크릿으로 막았다. 로컬 전용이라 비밀번호의 실익이 없다 |
| DB 포트 | 5432, 5433 / 54329 | 54329 | 이 기기의 5433 을 다른 컨테이너가 쓰고 있었다 |
| 본문 추출 | 직접 / 라이브러리 | `linkedom` + `@mozilla/readability` | 가정 4 확인에 썼고 spec-01-06 에서도 쓴다 |
| 로컬 사용자 ID | `...0001` / `00000000-0000-4000-8000-000000000001` | 후자 | `zod` 4 의 UUID 검사가 형식에 맞지 않는 값을 거부했다 |

| 서버 구조 | 도메인 함수가 SQL 직접 실행 / 세 계층과 저장소 | 세 계층(`domain` ← `application` ← `infrastructure`)과 저장소, 조립은 `src/server/container.ts` 한 곳 | 사용자 요청 (PR #3 리뷰). ADR-006 |
| 유스케이스의 모양 | 클래스와 DI 컨테이너 / 포트를 인자로 받는 함수 | 함수 | 혼자 만드는 단계에 껍데기를 줄인다 |
| 메모리 저장소와 실제 DB 의 차이 | 신경 쓰지 않음 / 계약 테스트 | 같은 계약 테스트를 두 구현에 모두 실행 | 메모리 구현이 실제와 달라 거짓으로 통과하는 테스트를 막는다 |
| 의존 규칙의 강제 | 문서로만 / lint | `no-restricted-imports` 와 그 설정을 확인하는 테스트(`src/architecture.test.ts`) | 규칙이 lint 설정 실수로 조용히 꺼지는 것을 막는다 |
| 명령의 위치 | `src/db/`, `src/worker/` 에 흩어짐 / 진입점 폴더 | `src/cli/` | 진입점은 `app`, `worker`, `cli` 셋으로 모은다 |

새 ADR: ADR-006 서버 구조 (계획 변경 2). CLI 로그인 방식은 기존 ADR-001, ADR-004 를 고쳐 반영했다. 프론트 구조 ADR 은 ADR-007 이 된다.

## 💬 사용자 협의

- **주제**: Claude Code CLI 의 로그인
  - **합의**: `CLAUDE_CODE_OAUTH_TOKEN` 은 비워 두고, 지금은 로그인된 CLI 를 쓴다고 주석으로 남긴다 (`.env.example`). 그에 따라 작업 프로세스는 호스트에서 띄운다. 컨테이너 경로는 compose 의 선택 항목(`container-worker`)으로 남기되 확인되지 않았다고 적었다.
- **주제**: 프론트 구조
  - **합의**: 아직 정해진 것이 없다. 이후에 설계할 수 있도록 spec-01-04 의 첫 작업(ADR-006)으로 `backlog/phase-01.md` 에 추가했다 (`92704f8`).
- **주제**: 서버 구조 (PR #3 리뷰)
  - **합의**: 사용자가 "클린 아키텍처 혹은 간단한 아키텍처, DB 는 repository 패턴, 테스트도 그걸 활용"을 요청했다. 세 계층과 저장소, 계약 테스트 안을 제시했고, 사용자가 "PR #3 병합 전에 이 spec 안에서 고친다"를 승인했다. 아키텍처 문서(`docs/architecture.md`)도 함께 요청받아 썼다.
- **주제**: 통합 시나리오 2 의 문구
  - **합의**: PR #2 에서 물었으나 답이 없어 권장안으로 고쳤다 (Task 1).

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `pnpm lint && pnpm typecheck && pnpm test`
- **결과**: ✅ Passed
```text
 Test Files  8 passed (8)
      Tests  57 passed (57)
```

DB 를 멈춘 상태에서 `pnpm test:unit`: 6 파일, 40개 통과.

| 파일 | 확인하는 것 | 실제 DB |
|---|---|:---:|
| `src/product.test.ts` | 실행기와 경로 별칭 | |
| `src/architecture.test.ts` | 계층의 의존 규칙을 lint 가 막는다 (막는 12가지, 허용하는 5가지) | |
| `src/application/health.test.ts` | ok, down, 확인 중 예외도 down | |
| `src/application/users.test.ts` | 지금 사용자, 로컬 사용자가 없을 때의 안내 | |
| `src/application/jobs.test.ts` | 처리기 성공·실패, 등록되지 않은 종류, `toString` 같은 기본 속성 이름, 한 번에 하나 | |
| `src/testing/in-memory/in-memory-repositories.test.ts` | 저장소 계약 (메모리) | |
| `src/infrastructure/repositories/postgres-repositories.test.ts` | 저장소 계약 (Postgres), 동시에 가져가도 겹치지 않음, 상태 확인 | O |
| `src/infrastructure/db/migrate.test.ts` | 처음 적용, 두 번 실행해도 한 번, 동시에 실행해도 한 번 | O |

### 수동 검증

1. **Action**: `docker compose up -d --wait`, `curl localhost:3000/api/health`
   - **Result**: 두 컨테이너가 healthy. `{"db":"ok"}` 200. DB 를 멈추면 `{"db":"down"}` 503, 다시 켜면 200.
2. **Action**: 호스트에서 `pnpm worker`, `pnpm job:enqueue noop`, `pnpm job:enqueue no-such-kind`
   - **Result**: 작업 1 은 `done`, 작업 2 는 `failed` 와 "등록되지 않은 작업 종류: no-such-kind".
3. **Action**: `docker compose down` 뒤 `up`
   - **Result**: 작업 기록 2건과 로컬 사용자가 남아 있었다. 웹 앱은 "적용할 마이그레이션 없음"을 찍고 떴다.
4. **Action**: `git log -p origin/main..HEAD` 에서 토큰과 비밀번호 패턴 검색
   - **Result**: 없음. `.env` 는 만들지 않았다.

ADR-004 의 가정 확인 결과는 `docs/experiments/02-cli-assumptions/README.md` 에 있다. 가정 2~4 통과, 가정 1 은 확인하지 않음.

## 🔍 발견 사항

- **계획 변경 2 뒤에도 동작은 같다.** 구조를 옮긴 뒤 compose, `/api/health`, `pnpm worker`, `pnpm job:enqueue`, `pnpm db:migrate`, `pnpm build` 를 다시 돌려 같은 결과를 확인했다.
- **커밋 훅의 lint 단계가 삭제된 파일에서 오류를 냈다** (`No files matching the pattern "src/domain/health.test.ts"`). 훅이 경고로 처리해 커밋은 통과했다. kit 의 문제로 보인다.
- **커밋 훅이 "단언이 보이지 않는 테스트"를 경고했다.** 계약 테스트는 단언이 계약 파일(`src/testing/contracts/`) 안에 있고, 실행 파일은 계약을 부르기만 해서 그렇게 보인다.
- **이 spec 을 한 번 ship 한 뒤 다시 열었다.** `sdd ship` 이 상태를 비워서, 상태 파일의 spec 과 Plan Accept 를 사용자 승인에 따라 직접 되돌렸다. phase 표의 상태도 `In Progress` 로 되돌렸다.

- **precheck 등록이 저장소에 남지 않는다.** `sdd config precheck add` 는 `.harness-kit/installed.json` 에 적는데, `.harness-kit/` 이 gitignore 되어 있다. 이 기기에서만 유효하다. 등록한 명령: `docker compose up -d --wait db`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- **테스트는 DB 가 떠 있어야 돈다.** precheck 첫 명령으로 DB 를 띄우게 했다.
- **CLI 호출 비용 추정치**: 다섯 번에 약 0.87 달러 (구독이라 청구액은 아님). 도구 없이 한 낱말을 받아도 0.08 달러로 잡힌다. spec-01-06 에서 책 한 권의 수집 비용을 잴 때 참고한다.
- **CLI 는 표준 입력을 닫아야 한다.** 그렇지 않으면 3초를 기다린다.
- **compose 의 이름 없는 볼륨 소유권**: `.next` 를 이름 없는 볼륨으로 덮었더니 root 소유로 만들어져 웹 앱이 죽었다. 이미지에 node 소유로 미리 만들어 해결했다.
- **범위 밖 경고**: 커밋 훅이 spec 의 Proposed Changes 에 없는 파일을 경고했다. 대부분 spec 에 "뼈대"로 묶어 적은 파일이다. spec 에 없던 것은 `src/product.ts`(제품 이름 상수)와 그 테스트, `src/app/health-status.tsx`(첫 화면의 상태 표시), `src/db/config.ts`, `src/db/testing.ts`, `src/worker/enqueue-cli.ts`, `docker/db-init/` 이다.
- **실험 01 의 접속 거부 사이트**는 주소를 기록해 두지 않아 다시 시도하지 못했다.

## 🚧 이월 항목

- 트랜잭션이 필요한 유스케이스의 포트 설계 → 처음 필요해지는 spec (ADR-006 §2)

- 컨테이너 안의 작업 프로세스 (토큰 경로) → 확인되지 않음. 필요해지면 확인
- 문장 대조를 전체 글자와 기사 본문 중 어디에 할지, 긴 본문에서의 인용 정확도 → spec-01-06
- 프론트 구조 → spec-01-04 의 첫 작업 (ADR-006)
- 마이그레이션 되돌리기 → 필요해지면
