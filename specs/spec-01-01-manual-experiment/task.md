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

## Task 1-R: 리허설 (추가)

> 사용자 결정(2026-11-17)으로 추가. 본 실험 전에 가상의 해석으로 프롬프트와 검색·출처 확인을 점검한다.

- [x] 『채식주의자』와 가상의 해석으로 배경 → 다른 시선 → 비교 수행, 출처 7개 직접 확인
- [x] `docs/experiments/01-manual-flow/rehearsal.md` — 결과와 알게 된 것
- [x] `prompts.md` 보완과 변경 이력 기록
- [x] Commit: `docs(spec-01-01): add rehearsal record and refine prompts`

---

## Task 2: 책 1 수행과 기록

### 2-1. 사용자 수행 (에이전트 대기)
- [x] 사용자가 책 1 로 inkle 방식을 수행 (이 세션에서 진행). 일반 채팅 비교는 미수행 — Task 4 전에 수행 여부 결정

### 2-2. 기록 정리
- [x] `docs/experiments/01-manual-flow/book-1.md` — 양식에 맞춰 정리, 출처 점검 결과 포함
- [x] Commit: `docs(spec-01-01): record experiment for book 1`

---

## Task 3: 책 2 수행과 기록 — 생략

> 사용자 결정(2026-11-17): 책 1 로 감을 잡았으므로 책 2 는 하지 않는다. 비문학과 순서 B 는 미검증으로 `findings.md` 에 기록한다.

---

## Task 4: 결과 정리와 판단

### 4-1. 결과 문서
- [x] `docs/experiments/01-manual-flow/findings.md` — 리허설과 책 1 정리, 판단 기준 대비 결과, 열린 질문 세 가지의 답, spec-01-02 로 넘길 입력
- [x] 사용자가 점검 1 판단 (계속 / 수정 후 재실험 / 중단) → 계속

### 4-2. 목표와 계획 반영
- [x] `docs/goals.md` — 답이 나온 열린 질문 정리
- [x] `backlog/phase-01.md` — 결정 기록 추가, 필요 시 이후 spec 방향성 수정
- [x] Commit: `docs(spec-01-01): add findings and update goals`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [x] 자동 테스트 없음 (문서 전용). spec.md 의 수동 검증 시나리오 4개 확인

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] Commit: `docs(spec-01-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [x] `git push -u origin spec-01-01-manual-experiment`
- [x] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
