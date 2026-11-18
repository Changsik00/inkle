# Task List: spec-01-08

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 계획 문서

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-08-collection`

### 1-2. 문서
- [x] `spec.md`, `task.md`, sdd 자동 갱신분
- [x] Commit: `docs(spec-01-08): add spec and task for collection`

---

## Task 2: 도메인 (대조 규칙, 수집 규칙)

### 2-1. 테스트 작성 (TDD Red)
- [x] `quote-match.test.ts`: 공백·줄바꿈, 따옴표 모양, 줄임표 차이는 통과 / 맞춤법을 고친 문장·줄인 문장·다른 글의 문장은 실패 / 너무 짧은 인용(10자 미만)은 실패
- [x] `collection.test.ts`: 보여 줄 수 있음(통과 인용 ≥1), 흔한 읽기(통과 시선 <3 이면 모두 알 수 없음), 상태 전이
- [x] 테스트 실행 → Fail 확인

### 2-2. 구현 (TDD Green)
- [x] `domain/quote-match.ts`, `domain/collection.ts`
- [x] Commit: `feat(spec-01-08): add quote matching and collection rules`

---

## Task 3: 수집 절차 (포트, 유스케이스, 지시문)

### 3-1. 테스트 작성 (TDD Red)
- [x] 저장소 계약: 수집 기록, 출처, 항목과 인용, 최근 수집 (보여 줄 수 있는지는 도메인 `isShowable` 로 고른다)
- [x] `application/collection.test.ts` (메모리 저장소, 대역 LLM·PageFetcher): 절차 전체, 열지 못한 출처, 대조 실패, 형식 오류 다시 시도, 한 출처의 실패, 비용 합계, 모델·지시문 판 기록, 흔한 읽기, 대기열 넣기
- [-] `application/sessions.test.ts`: 모임 시작 시 수집 → Task 5 로 옮김 (조립에 Postgres 저장소가 있어야 해서)
- [x] 테스트 실행 → Fail 확인

### 3-2. 구현 (TDD Green)
- [x] 포트, `application/collection.ts`, 지시문과 결과 스키마(`application/prompts/*.v1.ts`, 도메인 밖 파일 읽기를 피하려고 `.md` 대신 TS), 메모리 저장소, 대역
- [x] Commit: `feat(spec-01-08): add collection pipeline with llm and page fetcher ports`

---

## Task 4: 인프라 (CLI, 페이지 가져오기, Postgres)

### 4-1. 테스트 작성 (TDD Red)
- [x] `claude-code-cli.test.ts`: 가짜 `claude` 실행 파일로 인자·빈 디렉토리·표준 입력·API 키 빼기·결과 읽기·오류·시간 제한 (다시 묻기는 유스케이스가 한다)
- [x] `http-page-fetcher.test.ts`: 로컬 HTTP 서버로 본문 추출, 넘겨주기, EUC-KR, 열지 못함의 경우들, 내부 주소 막기
- [x] Postgres 계약 실행
- [x] 테스트 실행 → Fail 확인

### 4-2. 구현 (TDD Green)
- [x] `ClaudeCodeCli`, `HttpPageFetcher`, `0004_collections.sql`, Postgres 저장소, `container`
- [x] Commit: `feat(spec-01-08): add claude code cli client, page fetcher and collection storage`

---

## Task 5: 연결 (작업 처리기, 명령)

- [ ] 작업 처리기 `collect-book`, `startSession` 의 대기열 넣기 연결 (`sessions.test.ts`: 수집이 한 번만 대기열에)
- [ ] `pnpm collect`, `pnpm collect:report`
- [ ] 처리기 테스트 (메모리, 대역)
- [ ] lint, 타입 검사, 전체 테스트, E2E
- [ ] Commit: `feat(spec-01-08): wire collection worker handler and commands`

---

## Task 6: 실제 수집과 기록 (구독 사용량 사용)

- [ ] 『채식주의자』, 『노인과 바다』 를 등록하고 실제로 수집
- [ ] 보고서로 통과율·시간·비용 확인, 보여 줄 수 있는 항목의 출처 다섯 개 이상 직접 열어 확인
- [ ] 문제가 있으면 지시문을 고쳐 판을 올리고 다시 돌린다 (판 기록)
- [ ] `docs/experiments/03-collection/README.md`, ADR-004 에 측정 결과
- [ ] Commit: `docs(spec-01-08): record real collection runs for two books`

---

## Task 7: 문서

- [ ] `docs/architecture.md` (포트, 데이터, 흐름), `README.md` (명령), `backlog/phase-01.md`
- [ ] Commit: `docs(spec-01-08): document collection`

---

## Task 8: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS
- [ ] lint, 타입 검사, 빌드, E2E

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-08): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-08-collection`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
