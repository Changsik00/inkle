# Task List: spec-01-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 계획 문서와 ADR 확정

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-03-project-skeleton`

### 1-2. 문서
- [x] `spec.md`, `task.md`, sdd 자동 갱신분
- [x] ADR-001 ~ 005 의 상태를 `accepted` 로, `sdd adr-index`
- [x] `backlog/phase-01.md` 통합 시나리오 2 문구 수정
- [x] Commit: `docs(spec-01-03): add spec and task, accept adrs`

---

## Task 2: 뼈대 정리

### 2-1. 준비
- [x] `node_modules/next/dist/docs/` 에서 이 판의 Next.js 문서 중 필요한 부분을 읽는다 (`AGENTS.md` 의 지시)

### 2-2. 테스트 실행기 (TDD Red → Green)
- [x] Vitest, `tsx` 추가. `test`, `typecheck` 스크립트
- [x] 실행기가 도는지 확인하는 테스트 하나 → Pass 확인

### 2-3. 정리
- [x] `@anthropic-ai/sdk` 제거, 기본 화면과 `public/` 예시 그림 제거, 첫 화면 교체
- [x] `.gitignore` 에 `.env.example` 예외, `.env.example` 작성
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` 통과
- [x] Commit: `chore(spec-01-03): commit cleaned next.js skeleton with test runner`

---

## Task 3: ADR-004 가정 확인

> 선행 조건: 사용자가 `.env` 에 `CLAUDE_CODE_OAUTH_TOKEN` 을 넣었다. 없으면 멈추고 요청한다.

### 3-1. 이미지
- [x] `Dockerfile` (Node 22, pnpm, Claude Code CLI), `.dockerignore`. CLI 설치 방법은 공식 문서에서 확인

### 3-2. 확인
- [-] 가정 1: 컨테이너 안에서 토큰으로 `claude -p` 가 동작한다 — 사용자 결정으로 토큰을 쓰지 않음. 호스트의 로그인된 CLI 로 대신 확인
- [x] 가정 2: 웹 검색 도구만 켜고 검색 결과의 주소를 받는다
- [x] 가정 3: `--json-schema` 가 한국어가 섞인 결과에서 형식을 지킨다 (3회)
- [x] 가정 4: 실험에서 쓴 출처 주소들의 본문을 HTTP 요청으로 글자로 뽑는다 (한국어 5곳 이상, 영어 3곳 이상). 뽑힌 본문에서 실험 때 확인한 문장이 찾아지는지 본다

### 3-3. 기록
- [x] `docs/experiments/02-cli-assumptions/README.md` 에 실행 명령, 결과, 걸린 시간, 비용 추정치
- [x] ADR-004 의 가정 표에 결과 반영
- [x] **하나라도 틀리면 여기서 멈추고 보고** — 틀린 것 없음. 가정 1 은 미확인이라 대안(호스트 실행) 적용
- [x] Commit: `chore(spec-01-03): verify adr-004 assumptions in container`

---

## Task 4: compose 와 상태 확인

### 4-1. 테스트 작성 (TDD Red)
- [x] `src/db/` 연결 테스트, 상태 확인 함수 테스트 (DB 연결됨 / 안 됨)
- [x] 테스트 실행 → Fail 확인

### 4-2. 구현 (TDD Green)
- [x] `compose.yaml` (web, db, 이름 붙은 볼륨, 시험용 데이터베이스. worker 는 토큰이 있을 때만 쓰는 선택 항목)
- [x] `src/db/` 연결, `src/app/api/health/route.ts`
- [x] 테스트 실행 → Pass 확인. `docker compose up -d --wait` 뒤 `curl` 로 확인
- [x] Commit: `feat(spec-01-03): add docker compose with web, worker and db`

---

## Task 5: 마이그레이션과 로컬 사용자

### 5-1. 테스트 작성 (TDD Red)
- [x] 마이그레이션을 두 번 실행해도 한 번만 적용된다
- [x] 로컬 사용자가 한 명 있고 "지금 사용자"가 그 사용자를 돌려준다
- [x] 테스트 실행 → Fail 확인

### 5-2. 구현 (TDD Green)
- [x] 마이그레이션 실행 스크립트, `0001_init.sql` (사용자, 작업 대기열)
- [x] `src/domain/` 의 "지금 사용자"
- [x] 컨테이너가 뜰 때 마이그레이션이 적용되도록 연결
- [x] 테스트 실행 → Pass 확인
- [x] Commit: `feat(spec-01-03): add migrations and local user`

---

## Task 6: 작업 대기열과 작업 프로세스

### 6-1. 테스트 작성 (TDD Red)
- [x] 넣은 작업을 가져가면 "진행 중"이 되고, 끝내면 "끝남", 처리기가 실패하면 "실패"와 이유가 남는다
- [x] 동시에 두 번 가져가도 같은 작업을 둘이 잡지 않는다
- [x] 등록되지 않은 종류의 작업은 "실패"로 기록된다
- [x] 테스트 실행 → Fail 확인

### 6-2. 구현 (TDD Green)
- [x] `src/domain/` 의 작업 함수, `src/worker/` 진입점과 시험용 처리기
- [x] 테스트 실행 → Pass 확인
- [x] `pnpm worker` 를 호스트에서 띄우고 시험용 작업을 넣어 처리되는지, compose 재시작 뒤 기록이 남는지 확인
- [x] Commit: `feat(spec-01-03): add job queue and worker process`

---

## Task 7: 명령 등록과 README

### 7-1. 정리
- [ ] `sdd config precheck add` 로 lint, 타입 검사, 테스트 등록
- [ ] `README.md` 한국어로 교체 (소개, 준비물, 실행, 테스트, 토큰 설정)
- [ ] `backlog/phase-01.md`: 통합 테스트 실행 명령, phase-FF README 항목 완료
- [ ] Commit: `docs(spec-01-03): add readme and register precheck commands`

---

## Task 8: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS
- [ ] lint, 타입 검사 통과
- [ ] spec.md 의 수동 검증 시나리오 4개 확인

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-03-project-skeleton`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
