# Task List: spec-01-07

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 계획 문서

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-07-interpretation`

### 1-2. 문서
- [x] `spec.md`, `task.md`, sdd 자동 갱신분
- [x] Commit: `docs(spec-01-07): add spec and task for sessions and interpretation`

---

## Task 2: 도메인

### 2-1. 테스트 작성 (TDD Red)
- [x] `question-set.test.ts`: 소설 묶음 `fiction-v1` 의 질문 넷과 순서, 장르로 묶음 찾기
- [x] `interpretation.test.ts`: 다듬기(앞뒤 공백), 하나 이상 답, 4,000자, 묶음에 없는 질문 거부, 빈 답은 버림
- [x] `session.test.ts`: 단계(`writing` / `interpretation_saved`), 문 판단
- [x] 테스트 실행 → Fail 확인

### 2-2. 구현 (TDD Green)
- [x] `packages/backend/src/domain/{question-set,interpretation,session}.ts`
- [x] 테스트 실행 → Pass 확인
- [x] Commit: `feat(spec-01-07): add session, question set and interpretation rules`

---

## Task 3: 유스케이스와 저장소

### 3-1. 테스트 작성 (TDD Red)
- [x] 계약: `SessionRepository` (만들기, 사용자 것만 찾기, 책별 목록 최근 순), `InterpretationRepository` (판 덧붙이기 1, 2, …, 최근 판, 판이 없으면 null)
- [x] `application/sessions.test.ts` (메모리): 모임 시작(없는 책은 NOT_FOUND), 조회(책·질문·최근 해석·단계), 다른 사용자의 모임은 NOT_FOUND, 저장(새 판, 규칙 위반 이유), `requireUnlocked`(저장 전 LOCKED, 후 통과)
- [x] Postgres: 계약 실행, 같은 모임에 동시에 저장해도 판 번호가 겹치지 않음
- [x] 테스트 실행 → Fail 확인

### 3-2. 구현 (TDD Green)
- [x] 포트, `application/sessions.ts`, `0003_sessions.sql`, Postgres·메모리 저장소, `container`, 테스트 문맥
- [x] 테스트 실행 → Pass 확인
- [x] Commit: `feat(spec-01-07): add session use cases and repositories`

---

## Task 4: API

### 4-1. 테스트 작성 (TDD Red)
- [x] `rpc/sessions.test.ts`: 네 엔드포인트, 오류 코드, 다른 사용자의 모임, 모임 조회가 내 해석 전에 다음 단계의 내용을 담지 않음
- [x] OpenAPI 스냅샷과 엔드포인트 목록 갱신
- [x] 테스트 실행 → Fail 확인

### 4-2. 구현 (TDD Green)
- [x] `packages/contract/src/sessions.ts`, `rpc/sessions.ts`, 라우터
- [x] 테스트 실행 → Pass 확인
- [x] Commit: `feat(spec-01-07): add session api`

---

## Task 5: 화면

### 5-1. 테스트 작성 (TDD Red)
- [ ] `use-draft.test.tsx`: 임시 저장, 다시 열면 복원, 지우기, 저장하지 않은 글이 있으면 `beforeunload` 에서 묻기
- [ ] `interpretation-form.test.tsx`: 질문 넷, 빈 저장은 막고 이유, 저장 요청의 내용, 저장 뒤 읽기 모드와 "고쳐 쓰기", 서버 오류
- [ ] `book-detail.test.tsx`: "모임 시작"이 눌리고 모임을 만든 뒤 이동, 지난 모임 목록
- [ ] `e2e/interpretation.spec.ts`: 모임 시작 → 쓰기 → 새로고침해도 임시본 → 저장 → 새로고침해도 남음 → 고쳐 쓰기 → 책 정보의 지난 모임
- [ ] 테스트 실행 → Fail 확인

### 5-2. 구현 (TDD Green)
- [ ] `ui/textarea.tsx` (shadcn, DESIGN.md 에 맞게), `features/writing/use-draft.ts`, `features/sessions/*`, 페이지 둘, 책 정보 수정
- [ ] 테스트 실행 → Pass 확인. lint(`@shadcn/lint`), E2E, 빌드
- [ ] 스크린숏 (`docs/design/screens/interpretation-*.png`)
- [ ] Commit: `feat(spec-01-07): add interpretation writing screen`

---

## Task 6: 문서

- [ ] `docs/architecture.md` (포트, 데이터, 흐름), `README.md` (화면 주소), `backlog/phase-01.md`
- [ ] Commit: `docs(spec-01-07): document sessions and interpretation`

---

## Task 7: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS (`pnpm test`, `pnpm test:e2e`)
- [ ] lint, 타입 검사, 빌드
- [ ] spec.md 의 수동 검증 시나리오 7개

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-07): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-07-interpretation`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
