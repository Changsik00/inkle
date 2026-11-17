# Task List: spec-01-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> 본 spec 은 문서 전용(Research)이라 TDD 단계가 없습니다.

---

## Task 1: 실험 절차와 프롬프트

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-01-01-manual-experiment`

### 1-2. 문서 작성
- [x] `docs/experiments/01-manual-flow/README.md` — 목적, 절차, 수행 순서, 판단 기준
- [x] `docs/experiments/01-manual-flow/prompts.md` — 단계별 프롬프트(소설용·비문학용), 일반 채팅용 프롬프트
- [x] `docs/experiments/01-manual-flow/record-template.md` — 책별 기록 양식
- [x] Commit: `docs(spec-01-01): add manual experiment procedure and prompts`

---

## Task 2: 책 1 수행과 기록

### 2-1. 사용자 수행 (에이전트 대기)
- [ ] 사용자가 책 1 로 inkle 방식과 일반 채팅을 수행하고 대화 원문을 전달

### 2-2. 기록 정리
- [ ] `docs/experiments/01-manual-flow/book-1.md` — 양식에 맞춰 정리, 출처 점검 결과 포함
- [ ] Commit: `docs(spec-01-01): record experiment for book 1`

---

## Task 3: 책 2 수행과 기록

### 3-1. 사용자 수행 (에이전트 대기)
- [ ] 책 1 에서 드러난 프롬프트 문제를 고칠지 사용자와 확인 (고치면 `prompts.md` 에 변경 이력 기록)
- [ ] 사용자가 책 2 로 수행하고 대화 원문을 전달 (배경 노출 시점은 책 1 과 반대로)

### 3-2. 기록 정리
- [ ] `docs/experiments/01-manual-flow/book-2.md`
- [ ] Commit: `docs(spec-01-01): record experiment for book 2`

---

## Task 4: 결과 정리와 판단

### 4-1. 결과 문서
- [ ] `docs/experiments/01-manual-flow/findings.md` — 두 권 비교, 판단 기준 대비 결과, 열린 질문 세 가지의 답, spec-01-02 로 넘길 입력
- [ ] 사용자가 점검 1 판단 (계속 / 수정 후 재실험 / 중단)

### 4-2. 목표와 계획 반영
- [ ] `docs/goals.md` — 답이 나온 열린 질문 정리
- [ ] `backlog/phase-01.md` — 결정 기록 추가, 필요 시 이후 spec 방향성 수정
- [ ] Commit: `docs(spec-01-01): add findings and update goals`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] 자동 테스트 없음 (문서 전용). spec.md 의 수동 검증 시나리오 4개 확인

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-01-manual-experiment`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
