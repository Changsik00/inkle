# docs(spec-01-01): 수동 실험으로 흐름을 확인하고 목표와 계획에 반영

## 📋 Summary

### 배경 및 목적

코드를 만들기 전에 inkle 의 흐름(내 해석 → 배경 → 다른 시선 → 비교 → 토론 → 노트)이 쓸모 있는지 손으로 돌려 확인했다. 아키텍처 결정(spec-01-02)에 필요한 사실을 얻고, `docs/goals.md` 의 열린 질문에 답하는 것이 목적이다.

### 주요 변경 사항
- [x] 실험 절차, 단계별 프롬프트, 기록 양식 추가 (`docs/experiments/01-manual-flow/`)
- [x] 리허설 기록 (『채식주의자』, 가상의 독자)과 책 1 기록 (『노인과 바다』)
- [x] 실험 결과 문서: 점검 1 판단(계속), 확인된 것과 확인하지 못한 것, spec-01-02 로 넘길 입력
- [x] 목표와 phase-01 계획 반영: 토론과 노트를 선택 단계로, 소설부터, 효용 측정을 한 번 고르기로
- [x] 벤치마킹을 반영한 목표 재정리 (`349e651`, main 에 푸시되지 않았던 커밋이 함께 들어온다)

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: 0 구간(가설 확인). 점검 1 을 통과시키고 아키텍처 결정의 근거를 만든다.

## 🎯 Key Review Points

1. **점검 1 은 사전 기준을 충족하지 못한 채 "계속"으로 판단됐다.** 계획한 책 2권 중 1권만 수행했고, "생각이 달라졌는가"와 "일반 채팅보다 나은가"는 측정되지 않았다. 사용자 결정이며 `findings.md` §판단에 그대로 적었다. 두 항목은 점검 2 에서 잰다.
2. **흐름이 바뀌었다.** 독자가 반드시 써야 하는 것은 내 해석 한 번이고, 비교까지 보면 모임이 저장된다. `docs/goals.md` §핵심 경험, §원칙과 `backlog/phase-01.md` 의 성공 기준 2 가 달라졌다.
3. **출처 검증이 필수라는 근거.** 리허설에서 검색 요약 7개 중 2개가 원문과 달랐다 (`rehearsal.md`).
4. **공개 저장소 고려.** 내 해석 원문은 `raw/` 에 두고 gitignore 했다. 커밋된 기록에는 요약만 있다.

## 🧪 Verification

### 자동 테스트

문서 전용 spec 이라 자동 테스트가 없다.

### 수동 검증 시나리오
1. **프롬프트 진행**: 에이전트가 프롬프트 규칙대로 두 번 진행 → 막힘 없음. 새 채팅에서는 확인하지 않음
2. **책별 기록**: `book-1.md` 작성 → 사용자 판정 항목 다수가 "응답 없음". `book-2.md` 는 생략
3. **결과 문서**: `findings.md` 에 판단, 열린 질문의 답, 다음 spec 입력 → 있음
4. **열린 질문 정리**: `docs/goals.md` → 답이 나온 질문 제거, 미측정 항목을 새 질문으로 추가

## 📦 Files Changed

### 🆕 New Files
- `docs/experiments/01-manual-flow/README.md`: 실험 목적, 절차, 판단 기준
- `docs/experiments/01-manual-flow/prompts.md`: 내 해석 질문, 시작 프롬프트, 일반 채팅 프롬프트
- `docs/experiments/01-manual-flow/record-template.md`: 책별 기록 양식
- `docs/experiments/01-manual-flow/rehearsal.md`: 리허설 기록
- `docs/experiments/01-manual-flow/book-1.md`: 책 1 기록
- `docs/experiments/01-manual-flow/findings.md`: 실험 결과와 판단
- `specs/spec-01-01-manual-experiment/`: spec, task, walkthrough, pr_description

### 🛠 Modified Files
- `docs/goals.md`: 핵심 경험, 원칙, 성공 기준, 열린 질문 갱신
- `backlog/phase-01.md`: 목표 흐름, 성공 기준, 점검 1 결과, 결정 기록
- `backlog/queue.md`: sdd 자동 갱신
- `.gitignore`: `docs/experiments/*/raw/` 추가

**Total**: 14 files changed

## ✅ Definition of Done

- [ ] 책 2권의 기록 — 1권만 수행 (사용자 결정으로 범위 축소)
- [x] `findings.md` 작성
- [x] 점검 1 판단을 사용자가 내리고 `backlog/phase-01.md` 에 기록
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-01-manual-experiment/walkthrough.md`
- 실험 결과: `docs/experiments/01-manual-flow/findings.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
