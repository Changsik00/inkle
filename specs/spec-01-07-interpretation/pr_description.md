# feat(spec-01-07): 모임과 내 해석 쓰기

## 📋 Summary

### 배경 및 목적

inkle 의 첫 원칙은 "먼저 쓰고, 그다음 본다"다. 독자가 반드시 쓰는 곳은 내 해석 한 번뿐이다. 이 spec 은 모임을 열고 내 해석을 쓰는 화면, 그리고 내 해석 전에는 다음 단계를 열지 않는 문(門)을 만든다 (phase-01 성공 기준 5).

### 주요 변경 사항
- [x] **모임**: 책 정보에서 "모임 시작" → `/sessions/{id}/interpretation`. 같은 책으로 여러 번, 책 정보에 지난 모임 목록. 다른 사용자의 모임은 없는 것처럼
- [x] **내 해석**: 소설 질문 넷(`fiction-v1`), 하나 이상 답하면 저장, 고쳐 쓰면 새 판(이전 판 유지), 글쓴이 "나", "내가 쓴 글" 잉크
- [x] **쓰기 쉽게**: 브라우저 임시 저장과 복원, 떠날 때 묻기, 늘어나는 입력란, 글자 수
- [x] **문(門)**: `requireUnlocked` — 내 해석 전 `locked`. 모임 조회는 다음 단계의 내용을 담지 않는다
- [x] API 넷 (`POST/GET /books/{bookId}/sessions`, `GET /sessions/{id}`, `PUT /sessions/{id}/interpretation`), `0003_sessions.sql`

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: B 구간(첫 모임). 모임의 출발점과 성공 기준 5 의 문.

## 🎯 Key Review Points

1. **스크린숏**: `docs/design/screens/interpretation-writing.png`, `interpretation-saved.png`, `book-detail-sessions.png`
2. **문의 자리**: 애플리케이션 층의 `requireUnlocked` 하나. 이후 배경·시선·비교 API 가 모두 거친다.
3. **떠날 때 묻기는 창 닫기·새로고침·주소 이동만** 막는다. 앱 안 링크 이동은 묻지 않지만 임시본은 남는다.
4. **개발 DB 의 시험 자료**: 스크린숏을 찍으며 책과 모임을 지웠다 (walkthrough §발견 사항).

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

**결과 요약**:
- ✅ lint, 타입 검사, 빌드
- ✅ Vitest 198개 (29 파일)
- ✅ Playwright 5개

### 수동 검증 시나리오
1. 모임 시작 → 쓰기 화면 (E2E)
2. 새로고침해도 임시본 (E2E)
3. 떠날 때 묻기 (브라우저 테스트, beforeunload)
4. 저장 → 내 글 잉크, "내가 씀 · 판 1" (스크린숏)
5. 고쳐 쓰기 → 판 2 (E2E)
6. 책 정보의 지난 모임 (스크린숏)
7. 빈 저장은 보내지 않고 이유 (화면 테스트)

## 📦 Files Changed

### 🆕 New Files
- `packages/backend/src/domain/{session,question-set,interpretation,id}.ts` (+ 테스트)
- `packages/backend/src/application/sessions.ts` (+ 테스트)
- `packages/backend/src/infrastructure/db/migrations/0003_sessions.sql`, `repositories/postgres-session-repository.ts`
- `packages/backend/src/testing/{contracts/session-repository.contract.ts, in-memory/in-memory-session-repository.ts}`
- `packages/backend/src/rpc/sessions.ts` (+ 테스트), `packages/contract/src/sessions.ts`
- `apps/web/src/features/{sessions,writing}/`, `apps/web/src/ui/textarea.tsx`, `apps/web/src/app/sessions/[sessionId]/interpretation/page.tsx`
- `e2e/interpretation.spec.ts`, `docs/design/screens/{interpretation-writing,interpretation-saved,book-detail-sessions}.png`

### 🛠 Modified Files
- `packages/backend/src/{application/ports.ts, container.ts, rpc/router.ts, testing/rpc.ts}`, OpenAPI 스냅샷
- `packages/contract/src/index.ts`, `package.json`
- `apps/web/src/features/books/book-detail*.tsx`, `apps/web/next.config.ts` (redirects), `apps/web/src/testing/fixtures.ts`
- `e2e/books.spec.ts`, `docs/architecture.md`, `README.md`, `backlog/phase-01.md`

## ✅ Definition of Done

- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드와 E2E 통과
- [x] 수동 검증 시나리오 7개 확인, 스크린숏
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-07-interpretation/walkthrough.md`
- 아키텍처: `docs/architecture.md` §3 먼저 쓰고, 그다음 본다

🤖 Generated with [Claude Code](https://claude.com/claude-code)
