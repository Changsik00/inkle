# Backlog Queue

> 본 문서는 *대시보드* 입니다. "지금 무엇을 하고 있고, 다음에 무엇을 해야 하는가"를 한눈에 보기 위함.
>
> **자동 갱신 마커**: `active`, `specx`, `done` — 마커 (`<!-- sdd:... -->`) 사이는 sdd 가 관리하므로 그대로 두세요.
> **사람 편집 섹션**: `🧊 Icebox`, `📋 대기 Phase` — 자유 메모.

## 📦 진행 중 Phase

<!-- sdd:active:start -->
- **phase-01** — 혼자 읽는 모임 — 2 spec — 다음: spec-01-02-architecture-decisions
<!-- sdd:active:end -->

## 📥 spec-x 대기

<!-- sdd:specx:start -->
없음
<!-- sdd:specx:end -->

## 🧊 Icebox

> 아이디어·보류 항목 보관소. 실행 불가. 관련 항목이 쌓이면 Phase로, 단발이면 spec-x로 승격.
> 이 섹션은 sdd가 건드리지 않습니다. 자유롭게 편집하세요.

<!-- 예시:
- [ ] 아이디어: sdd stale detection 자동화
- [ ] 보류: spec-05-02 (dependency 해소 후 재검토)
-->

제품 수준의 미결정 사항(장르, 배경 노출 시점, 모바일 앱, 이름, 인용 공개 범위)은 `docs/goals.md` §열린 질문에서 관리한다. 여기에는 기능 아이디어와 보류 항목만 둔다.

- [ ] 아이디어: 책 사진에서 밑줄 문장 추출해 메모로 쓰기 (책 본문 없이 "책과 어긋나는 곳"을 짚을 때 근거가 됨)
- [ ] 보류: 외부 도서 검색 API 연동 (spec-01-04 는 직접 입력만. 책 등록이 번거롭다고 느껴지면 spec-x 로 승격)
- [ ] 아이디어: 커뮤니티 모임은 그믐처럼 기간이 정해져 있고 끝나면 기록으로 남는 방식 (커뮤니티 phase 설계 시)

## 📋 대기 Phase

> 다음에 진행할 phase 를 자유롭게 메모합니다 (사람이 직접 편집).
> 자동 갱신되지 않습니다 — Icebox 와 동일한 정책.

`docs/goals.md` §단계 기준. 각 phase 는 앞 단계의 "넘어가는 조건"을 확인한 뒤 구체화한다.

- **개인 위키와 지식 그래프** — 대화와 노트가 쌓여 책·작가·주제 페이지와 연결이 만들어진다. 이를 근거로 내가 무엇을 좋아하는지 보여준다 (내가 쓴 문장만 근거로 삼고, 사람을 규정하지 않는다). 위키와 그래프는 원본에서 다시 만들 수 있는 파생물로 둔다.
- **커뮤니티** — 공개한 노트와 책별 공유 위키. "다른 시선"에 inkle 독자의 해석이 섞인다. 다른 의견을 보기 전에 쓴 해석이 모여 "이 책을 사람들이 어떻게 갈라서 읽었나"를 보여준다. 인증과 호스팅 DB 를 이 단계 전에 붙인다.
- **함께 쓰기** — 사람 간 토론, 공동 창작. 커뮤니티 단계에서 관찰한 행동에 따라 범위를 정한다.

## ✅ 완료

<!-- sdd:done:start -->
없음
<!-- sdd:done:end -->

---

## 📖 사용 방법

| 명령 | 동작 |
|---|---|
| `sdd phase new <slug>` | 새 Phase 생성 → 진행 중으로 등록 |
| `sdd phase new <slug> --base` | Phase base branch 모드로 생성 (opt-in) |
| `sdd spec new <slug>` | 진행 중 Phase에 다음 spec 등록 |
| `sdd plan accept` | spec Plan Accept → 실행 모드 진입 |
| `sdd ship` | spec 완료 처리 → Merged 갱신 + state 초기화 + NEXT 안내 |
| `sdd phase done <N>` | Phase 완료 → 완료 섹션으로 이동 |

자세한 사용법: `agent/constitution.md` §3 Work Type Model, `agent/agent.md`
