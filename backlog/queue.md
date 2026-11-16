# Backlog Queue

> 본 문서는 *대시보드* 입니다. "지금 무엇을 하고 있고, 다음에 무엇을 해야 하는가"를 한눈에 보기 위함.
>
> **자동 갱신 마커**: `active`, `specx`, `done` — 마커 (`<!-- sdd:... -->`) 사이는 sdd 가 관리하므로 그대로 두세요.
> **사람 편집 섹션**: `🧊 Icebox`, `📋 대기 Phase` — 자유 메모.

## 📦 진행 중 Phase

<!-- sdd:active:start -->
- **phase-01** — solo-reading-club — 0/0 spec — (다음: 첫 spec 생성 대기)
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

- [ ] 결정 필요: 배경과 작가의 의도를 내 해석을 쓰기 전에도 볼 수 있게 할 것인가 (`docs/goals.md` 열린 질문, spec-01-05 착수 전)
- [ ] 결정 필요: 사업화 시점에 모바일 앱이 필요한가 (spec-01-01 앱 구조 ADR 에 영향)
- [ ] 확인: `inkle` 이름의 상표와 도메인 (영국 게임 스튜디오 inkle 과 겹침, 사업화 전)
- [ ] 정책: 책 인용 문장의 공개 분량 제한 (커뮤니티 phase 전)
- [ ] 아이디어: 책 사진에서 밑줄 문장 추출해 메모로 쓰기
- [ ] 아이디어: 취향은 "내 위키에서 드러나는 것"으로 보여주고, 독자 간 매칭 점수는 만들지 않음

## 📋 대기 Phase

> 다음에 진행할 phase 를 자유롭게 메모합니다 (사람이 직접 편집).
> 자동 갱신되지 않습니다 — Icebox 와 동일한 정책.

`docs/goals.md` §단계 기준. 각 phase 는 앞 단계의 "넘어가는 조건"을 확인한 뒤 구체화한다.

- **개인 위키와 지식 그래프** — 대화와 노트가 쌓여 책·작가·주제 페이지와 연결이 만들어진다. 이를 근거로 내가 무엇을 좋아하는지 보여준다. 위키와 그래프는 원본에서 다시 만들 수 있는 파생물로 둔다.
- **커뮤니티** — 공개한 노트와 책별 공유 위키. "다른 시선"에 실제 독자의 해석이 섞인다. 인증과 호스팅 DB 를 이 단계 전에 붙인다.
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
