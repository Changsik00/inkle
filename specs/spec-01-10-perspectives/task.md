# Task List: spec-01-10

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: spec 과 task

- [x] `git checkout -b spec-01-10-perspectives`, `sdd spec new perspectives`
- [x] spec.md, task.md 작성, Plan Accept
- [x] `backlog/phase-01.md`: spec-01-10 을 다른 시선으로, 비교와 끝 고르기를 spec-01-11 로, 토론·노트를 01-12·01-13 으로
- [x] Commit: `docs(spec-01-10): add spec and task for perspectives`

---

## Task 2: 시선의 도메인 규칙

- [x] `domain/collection.ts`: 시선의 종류(외부 사람 / AI 가 만든 해석), `prevalenceOf`(작가 본인·AI 는 없음), 흔함을 매길 대상 고르기, `needsImagined`, `arrangePerspectives`(다른 사람 흔함 순 / 작가 본인 / AI)
- [x] 테스트 먼저 (Red → Green)
- [x] Commit: `feat(spec-01-10): add perspective rules`

---

## Task 3: 흔함 단계와 AI 가 만든 해석

- [x] `0006_imagined_perspectives.sql`, 포트와 Postgres·메모리 저장소(AI 가 만든 해석 쓰기, 종류 읽기), 계약 테스트
- [x] `application/collection.ts`: 흔함 단계에 작가 본인 제외, 마지막에 `imagine.v1`
- [x] `prompts/imagine.v1.ts`, 대역 LLM 의 단계 구분
- [x] 테스트: 대역 LLM 으로 부름·안 부름·실패
- [x] Commit: `feat(spec-01-10): add imagined perspectives when real ones are few`

---

## Task 4: 시선 API (문)

- [x] 수집 상태 계산을 배경과 함께 쓰도록 옮김
- [x] `packages/contract/src/perspectives.ts`: `get`
- [x] `application/perspectives.ts`: `perspectivesView` (`requireUnlocked`)
- [x] `rpc/perspectives.ts`, 라우터, OpenAPI 스냅샷, 테스트 (잠김, 404, 응답 모양)
- [x] Commit: `feat(spec-01-10): add perspectives api behind the gate`

---

## Task 5: 시선 화면

- [ ] 배경 화면에서 함께 쓸 부분을 `features/collection/` 으로 옮김 (배경 화면 테스트 그대로 통과)
- [ ] `features/perspectives/`, 페이지, 배경 화면의 "다른 시선 보기"
- [ ] 브라우저 테스트, `e2e/perspectives.spec.ts`
- [ ] Commit: `feat(spec-01-10): add perspectives screen`

---

## Task 6: 실제 확인과 기록

- [ ] 개발 DB 에 `pnpm db:migrate`, 두 책의 모임에서 시선 화면 확인
- [ ] `docs/experiments/05-perspectives/README.md`, 스크린숏 (『채식주의자』 모임)
- [ ] 공개 전 확인: 실제 해석 원문 구절이 기록·스크린숏에 없음
- [ ] Commit: `docs(spec-01-10): record perspectives on two books`

---

## Task 7: 문서

- [ ] `docs/architecture.md`, `README.md`, ADR-004 §6 기준 문장
- [ ] Commit: `docs(spec-01-10): update docs for perspectives`

---

## Task 8: Ship

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`
- [ ] walkthrough.md, pr_description.md, `/hk-ship`
