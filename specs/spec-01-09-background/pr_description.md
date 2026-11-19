# feat(spec-01-09): 배경과 작가의 의도

## 📋 Summary

### 배경 및 목적

내 해석을 저장한 뒤 볼 것이 없었다. spec-01-08 이 책 단위로 모은 배경을 그대로 늘어놓으면 일반적인 작품 소개가 된다. 수동 실험에서 효과가 있던 것은 배경을 **내 해석의 특정 부분 옆에** 두는 것이었다. 이 spec 은 그 "연결"을 독자별로 만들고, 문(門)을 거쳐 배경 화면으로 보여 준다.

### 주요 변경 사항
- [x] **연결** (`domain/connection.ts`, `application/connections.ts`): 내 해석의 판마다 LLM(`connect.v2`, 도구 없음)이 맞닿는 배경을 최대 5개 고르고, **내 답에서 그대로 옮긴 구절**을 붙인다. 코드가 구절을 내 답과 문자열로 대조한다 (`matchQuote`). 통과하지 못한 연결은 내주지 않는다
- [x] **시점**: 내 해석을 저장할 때(수집이 끝났으면), 또는 수집이 끝날 때(그 책의 모든 모임) 대기열에 넣는다. 같은 판·수집으로는 한 번. 새 판이면 새로 만들고 이전 것은 남긴다 (ADR-005)
- [x] **API** (문): `GET /api/sessions/{id}/background` (수집·연결 상태, 맞닿는 배경, 주제별 나머지), `POST …/background/recollect` (실패·없음·멈춤일 때만 다시 모으기). 내 해석 전에는 `403 LOCKED`, 상태도 내주지 않는다
- [x] **화면** `/sessions/{id}/background`: 맞닿는 배경을 위에(내 구절 → 맞닿는 곳 → 배경과 인용), 나머지는 주제별로 접기. 진행 중이면 3초마다 다시 읽기, 확인하지 못함과 다시 모으기, 잠김 안내. 내 해석 화면에 "배경 보기"
- [x] **글쓴이 표시** (`ui/authored.tsx`): "내가 씀"(만년필 파랑) / "AI 가 씀"(흑연 회색) / 바깥 사람의 인용(명조, 왼쪽 선, 누가·어디서) / "AI 가 옮김". spec-01-10 에서 당겨 옴
- [x] `0005_connections.sql` (`connection_runs`, `connections`)

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: 흐름의 3단계(배경). 문(門)을 처음으로 거치는 API.

## 🎯 Key Review Points

1. **실제 연결** (`docs/experiments/04-connections/README.md`): 수동 실험의 해석 두 편. connect.v1 은 질문 문장을 옮긴 연결 하나(대조가 거름)와 배경을 되풀이하는 설명 → connect.v2 에서 9/9 통과. 판마다 7~19초, 0.03~0.06달러 (Sonnet 5.5). 독자를 평가하는 문장 없음.
2. **스크린숏**: `docs/design/screens/background-connected.png`, `background-others.png`.
3. **E2E 가 남긴 수집**: 시험용 책의 수집이 대기열에 쌓인다. 작업 프로세스를 띄우기 전에 손으로 실패 처리했다 (walkthrough §발견 사항, 다음 spec 전 정리 후보).
4. **E2E 기다림 10초** (`playwright.config.ts`): 개발 서버의 첫 컴파일 때문에 동시 실행에서 가끔 실패했다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

**결과 요약**:
- ✅ lint, 타입 검사, 빌드
- ✅ Vitest 328개 (39 파일)
- ✅ Playwright 6개

### 수동 검증 시나리오
1. 내 해석 전 화면·API 잠김 (E2E)
2. 두 책의 실제 연결, 맞닿는 배경 위·나머지 접힘 (실험 기록, 스크린숏)
3. 내 구절이 내 답에 그대로 있고 평가 문장이 없음 (실험 기록)
4. 새 판 → 새 연결, 이전 판 연결 남음 (실제 실행)
5. 다시 모으기 (API·화면 테스트)

## 📦 Files Changed

### 🆕 New Files
- `packages/backend/src/domain/connection.ts` (+ 테스트)
- `packages/backend/src/application/{connections.ts, llm-ask.ts}` (+ 테스트), `application/prompts/connect.{v1,v2}.ts`
- `packages/backend/src/infrastructure/db/migrations/0005_connections.sql`, `repositories/postgres-connection-repository.ts`
- `packages/backend/src/testing/{contracts/connection-repository.contract.ts, in-memory/in-memory-connection-repository.ts}`
- `packages/contract/src/background.ts`, `packages/backend/src/rpc/background.ts` (+ 테스트)
- `apps/web/src/features/background/`, `apps/web/src/ui/authored.tsx`, `apps/web/src/app/sessions/[sessionId]/background/page.tsx`
- `e2e/background.spec.ts`, `docs/design/screens/background-{connected,others}.png`, `docs/experiments/04-connections/README.md`

### 🛠 Modified Files
- `packages/backend/src/application/{ports.ts, sessions.ts, collection.ts}`, `container.ts` (`collector` → `workerDeps`), `worker/handlers.ts`, 세션 저장소(`listByBook`), 테스트 문맥·대역 LLM, OpenAPI 스냅샷
- `packages/contract/{package.json, src/index.ts}`, `apps/worker/src/main.ts`
- `apps/web/src/features/sessions/interpretation-form.tsx` (배경 보기), `apps/web/src/testing/fixtures.ts`, `playwright.config.ts`
- `DESIGN.md` (글쓴이 표시 컴포넌트), `docs/architecture.md`, `README.md`, `backlog/phase-01.md`

## ✅ Definition of Done

- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드와 E2E 통과
- [x] 두 책의 실제 연결과 기록, 스크린숏
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-09-background/walkthrough.md`
- 실험: `docs/experiments/04-connections/README.md`
- 아키텍처: `docs/architecture.md` §3 배경과 연결

🤖 Generated with [Claude Code](https://claude.com/claude-code)
