# Task List: spec-01-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> 문서 전용 spec 이라 테스트 작성 단계(TDD)는 없습니다.

---

## Task 1: spec 문서와 브랜치

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-02-architecture-decisions`

### 1-2. 계획 문서 커밋
- [x] `spec.md`, `task.md`, `backlog/phase-01.md`, `backlog/queue.md` (sdd 자동 갱신분, spec-01-01 상태를 Merged 로 정정)
- [x] Commit: `docs(spec-01-02): add spec and task for architecture decisions`

---

## Task 2: ADR-001 앱 구조와 스택

### 2-1. 작성
- [x] 선택지 비교: Next.js 단일 앱 / 프론트와 백엔드 분리 / 서버 렌더링 없는 단일 페이지 앱
- [x] 작업 프로세스와 대기열 방식, 모바일 앱에 대한 가정
- [x] 미커밋 Next.js 뼈대를 살릴지 판단
- [x] `docs/decisions/ADR-001-app-structure.md`
- [x] Commit: `docs(spec-01-02): add adr-001 app structure`

---

## Task 3: ADR-002 데이터 모델

### 3-1. 작성
- [x] 책 단위와 독자 단위 두 층의 개념과 관계 (다이어그램 포함)
- [x] 시선의 종류, "얼마나 흔한 읽기인가", 글쓴이 구분, 장르
- [x] 선택지 비교: 시선을 하나의 개념으로 / 종류별로 따로
- [x] `docs/decisions/ADR-002-data-model.md`
- [x] Commit: `docs(spec-01-02): add adr-002 data model`

---

## Task 4: ADR-003 사용자 식별

### 4-1. 작성
- [x] 선택지 비교: 처음부터 식별자 / 인증을 붙일 때 추가
- [x] 식별자를 두는 범위 (독자 단위 자료만)
- [x] `docs/decisions/ADR-003-user-identity.md`
- [x] Commit: `docs(spec-01-02): add adr-003 user identity`

---

## Task 5: ADR-004 LLM 근거와 출처 검증

### 5-1. 공식 문서 확인
- [ ] Claude Code CLI 의 비대화 실행, 출력 형식, 허용 도구 제한, 컨테이너 안에서의 로그인 방법을 공식 문서에서 확인

### 5-2. 작성
- [ ] 검색 → 가져오기 → 문장 대조 단계와, 대조를 코드로 하는 방식
- [ ] LLM 호출 경계: 지금은 Claude Code CLI, 나중에 Claude API. 바꾸는 조건
- [ ] 선택지 비교: Claude Code CLI / Claude API / CLI 의 웹 가져오기에 맡기기와 앱이 직접 가져오기
- [ ] 출처의 종류, 오독 근거의 종류, 번역된 인용의 처리
- [ ] 비동기 수집, 내 해석 저장 전 비노출을 막는 층
- [ ] 접근이 거부되는 사이트, 예상 비용, 검증이 필요한 가정
- [ ] `docs/decisions/ADR-004-llm-grounding.md`
- [ ] Commit: `docs(spec-01-02): add adr-004 llm grounding`

---

## Task 6: ADR-005 원본과 파생물

### 6-1. 작성
- [ ] 원본과 파생물의 목록, 파생물에 남기는 출처 기록
- [ ] 선택지 비교: 덧붙이기만 하는 원본 / 고쳐 쓰는 저장
- [ ] 2단계 위키가 이 원본으로 만들어질 수 있는지 확인
- [ ] `docs/decisions/ADR-005-source-and-derived.md`
- [ ] Commit: `docs(spec-01-02): add adr-005 source and derived`

---

## Task 7: 계획 반영

### 7-1. 목록과 계획 갱신
- [ ] `./.harness-kit/bin/sdd adr-index` 로 `docs/decisions/README.md` 생성
- [ ] `backlog/phase-01.md`: 이후 spec 의 범위와 순서 재검토, 뼈대 처리, 결정 기록
- [ ] `docs/goals.md`: 모바일 앱 열린 질문과 ADR 경로 갱신
- [ ] Commit: `docs(spec-01-02): reflect adrs in phase plan and goals`

---

## Task 8: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] `./.harness-kit/bin/sdd adr-index --check` 통과
- [ ] spec.md 의 수동 검증 시나리오 4개 확인

### 📝 산출물 작성

- [ ] **walkthrough.md 작성** (`findings.md` 입력 9개의 대응표 포함)
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-02): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-02-architecture-decisions`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
