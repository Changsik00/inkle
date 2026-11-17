# docs(spec-01-02): 아키텍처 결정 ADR 5개와 phase-01 계획 반영

## 📋 Summary

### 배경 및 목적

수동 실험(spec-01-01)에서 드러난 제약을 구조에 반영하고, 구현 전에 정해야 할 다섯 가지를 ADR 로 남긴다. 코드는 없다.

### 주요 변경 사항
- [x] ADR-001 앱 구조: 단일 Next.js 앱, 작업 프로세스, Postgres 대기열, 화면은 HTTP API 만 사용
- [x] ADR-002 데이터 모델: 책 단위와 독자 단위 두 층, 시선은 하나의 개념, 글쓴이 구분
- [x] ADR-003 사용자 식별: 독자 단위 자료에 처음부터 식별자, 인증 없는 로컬 사용자
- [x] ADR-004 LLM 근거: Claude Code CLI 를 구독으로 사용, 앱이 출처를 직접 열어 인용 문장을 문자열로 대조
- [x] ADR-005 원본과 파생물: 원본은 덧붙이기만, 파생물은 만든 재료를 기록
- [x] `backlog/phase-01.md`: "자료 수집"을 spec-01-06 으로 추가 (이후 번호가 하나씩 밀림), spec-01-03 의 첫 작업으로 가정 확인 추가

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: A 구간(기반)의 첫 spec. 이후 모든 spec 이 따를 구조를 정한다.

## 🎯 Key Review Points

1. **ADR 은 모두 `proposed` 상태다.** 이 PR 의 병합이 확정이다. 받아들이기 어려운 결정이 있으면 병합 전에 알려 달라.
2. **Claude Code CLI 를 구독으로 쓴다 (ADR-004).** 다른 사람에게 열기 전에는 Claude API 로 바꿔야 한다. 구독으로 자기 스크립트를 돌리는 것이 허용되는지는 공식 문서가 명시하지 않는다.
3. **ADR-004 의 가정 네 가지는 실제로 돌려 보지 않았다.** 컨테이너 안의 CLI 동작, 웹 검색만 켜기, 결과 형식, 한국어 페이지 본문 추출. spec-01-03 에서 가장 먼저 확인한다.
4. **통합 시나리오 2 와 어긋나는 곳이 있다.** 시나리오는 내 해석 저장 전에 LLM 호출이 없다고 적는데, ADR-004 는 책 단위 수집을 미리 돌린다 (결과는 내주지 않는다). 어느 쪽을 고칠지 결정이 필요하다.
5. **보여줄 자료가 줄어들 수 있다.** 문자열 대조를 통과한 인용이 없는 항목은 내주지 않는다. 통과율은 spec-01-06 에서 잰다.

## 🧪 Verification

### 자동 테스트
```bash
./.harness-kit/bin/sdd adr-index --check
```

**결과 요약**:
- ✅ ADR 인덱스 정합

문서 전용 spec 이라 그 밖의 자동 테스트는 없다.

### 수동 검증 시나리오
1. **실험 입력 9개의 대응**: `walkthrough.md` 의 대응표 → 9개 모두 다룸. 9번(일반 독자의 글 찾기)은 일부만 풀림
2. **원칙 9개와의 대조**: `walkthrough.md` 의 표 → 어긋나는 결정을 찾지 못함
3. **"먼저 쓰고, 그다음 본다"의 강제 위치**: ADR-001 §4, ADR-004 §7 → 설명됨
4. **선택지 비교**: ADR 마다 채택하지 않은 선택지 3~5개

## 📦 Files Changed

### 🆕 New Files
- `docs/decisions/ADR-001-app-structure.md`: 앱 구조와 스택
- `docs/decisions/ADR-002-data-model.md`: 데이터 모델
- `docs/decisions/ADR-003-user-identity.md`: 사용자 식별
- `docs/decisions/ADR-004-llm-grounding.md`: LLM 호출과 출처 검증
- `docs/decisions/ADR-005-source-and-derived.md`: 원본과 파생물
- `docs/decisions/README.md`: ADR 목록 (`sdd adr-index` 생성)
- `specs/spec-01-02-architecture-decisions/`: spec, task, walkthrough, pr_description

### 🛠 Modified Files
- `backlog/phase-01.md`: 이후 spec 의 범위와 번호, 의존성, 위험 요소, 결정 기록, spec-01-01 상태
- `backlog/queue.md`: sdd 자동 갱신
- `docs/goals.md`: 열린 질문 (모바일 앱의 가정, API 전환과 본문 보관), ADR 경로

**Total**: 13 files changed

## ✅ Definition of Done

- [x] ADR 5개 작성, 각각 선택지 비교 포함
- [x] `docs/decisions/README.md` 생성, `sdd adr-index --check` 통과
- [x] `findings.md` 입력 9개의 대응표가 `walkthrough.md` 에 있음
- [x] `backlog/phase-01.md` 에 이후 spec 재검토 결과 반영
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-02-architecture-decisions/walkthrough.md`
- ADR 목록: `docs/decisions/README.md`
- 실험 결과: `docs/experiments/01-manual-flow/findings.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
