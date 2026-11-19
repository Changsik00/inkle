# Task List: spec-01-09

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: spec 과 task

- [x] `git checkout -b spec-01-09-background`, `sdd spec new background`
- [x] spec.md, task.md 작성, Plan Accept
- [x] Commit: `docs(spec-01-09): add spec and task for background`

---

## Task 2: 연결의 도메인 규칙

- [x] `domain/connection.ts`: 연결·연결 만들기 타입과 상태, 내 구절 대조(`matchQuote` 재사용, 질문 번호 찾기), 목록 밖 배경 번호 버리기, 화면 정렬(맞닿는 것 먼저, 나머지 주제별)
- [x] 테스트 먼저 (Red → Green)
- [x] Commit: `feat(spec-01-09): add connection rules`

---

## Task 3: 연결 만들기 (유스케이스, 저장소, 지시문)

- [x] 포트 `ConnectionRepository`, `SessionRepository.listByBook`
- [x] `prompts/connect.v1.ts`, `application/connections.ts`: `enqueueConnections`, `connectBackground`
- [x] 저장 뒤(`saveInterpretation`)와 수집 끝 뒤(`collectBook`)에 연결 넣기
- [x] `0005_connections.sql`, Postgres·메모리 저장소, 계약 테스트
- [x] 작업 처리기 `connect-background`, `container.ts`
- 메모: 수집이 끝난 뒤 연결 넣기는 `collectBook` 이 아니라 작업 처리기(`collect-book`)에서 한다. 수집 유스케이스가 모임을 몰라도 된다.
  LLM 에 묻기(`ask`)는 `application/llm-ask.ts` 로 옮겨 수집과 함께 쓴다. `container.collector` 는 `workerDeps` 로 바꿨다 (작업 프로세스 전체).
- [x] Commit: `feat(spec-01-09): make connections between background and interpretation`

---

## Task 4: 배경 API (문)

- [x] `packages/contract/src/background.ts`: `get`, `recollect`
- [x] `application/connections.ts`: `backgroundView`, `recollect` (`requireUnlocked`)
- [x] `rpc/background.ts`, 라우터, OpenAPI 스냅샷
- [x] 테스트: 잠김·다른 사용자·응답 키 고정·글쓴이 필드·다시 모으기 조건
- 메모: 오래 멈춘 수집·연결 만들기는 `failed` 로 내준다 (다시 모으기를 누를 수 있게). 응답은 화면 배치(맞닿는 것 / 주제별 나머지)대로 준다.
- [x] Commit: `feat(spec-01-09): add background api behind the gate`

---

## Task 5: 배경 화면

- [x] DESIGN.md 를 먼저 읽는다. 글쓴이 표시 컴포넌트 (DESIGN.md 의 시점 문장 고침)
- [x] `features/background/`: 맞닿는 배경, 다른 배경(접기), 인용과 옮김, 진행 상황과 다시 읽기, 확인하지 못함과 다시 모으기, 잠김 안내
- [x] 페이지 `/sessions/{id}/background`, 내 해석 화면의 "배경 보기"
- [x] 브라우저 테스트(MSW), `e2e/background.spec.ts`
- 메모: 글쓴이 표시는 `ui/authored.tsx` (`MyText`, `AiText`, `AuthorMark`, `ExternalQuote`). 다른 배경은 `<details>` 로 접는다.
  E2E 를 여럿 동시에 돌리면 개발 서버의 첫 컴파일 때문에 화면 이동이 5초를 넘겨 가끔 실패했다 → `playwright.config.ts` 의 기다림을 10초로 (네 번 연속 통과).
- [x] Commit: `feat(spec-01-09): add background screen`

---

## Task 6: 실제 연결과 기록 (구독 사용량 사용)

- [x] 두 책에 수동 실험의 해석을 저장하고 실제로 연결을 만든다
- [x] 내 구절 대조 통과율, 시간, 비용, 수동 실험과 비교. 독자를 평가하는 문장이 없는지 확인
- [x] 문제가 있으면 지시문을 고쳐 판을 올리고 다시 돌린다
  - 메모: `connect.v1` 이 질문 문장을 옮긴 연결 1개(대조가 거름), 배경을 되풀이하는 "맞닿는 곳" → `connect.v2`. 같은 답을 판 2 로 저장해 다시 만들었다 (판 1 의 연결은 남음). 실행 전에 E2E 시험용 책의 대기 수집 21건을 실패 처리했다
- [x] 스크린숏 `docs/design/screens/background*.png`, `docs/experiments/04-connections/README.md`
- [x] Commit: `docs(spec-01-09): record real connections for two books`

---

## Task 7: 문서

- [ ] `docs/architecture.md` (포트, 흐름, 데이터, 문), `README.md` (화면 주소), `backlog/phase-01.md`
- [ ] Commit: `docs(spec-01-09): document background`

---

## Task 8: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **전체 테스트 실행** → 모두 PASS
- [ ] lint, 타입 검사, 빌드, E2E

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-01-09): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-01-09-background`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
