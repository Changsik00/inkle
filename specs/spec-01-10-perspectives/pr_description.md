# feat(spec-01-10): 다른 시선

## 📋 Summary

### 배경 및 목적

spec-01-08 이 책마다 모아 둔 시선(평론가·독자·작가가 이 책을 어떻게 읽었는지)을 볼 곳이 없었다. 이 spec 은 문(門)을 거쳐 시선을 보여 주는 API 와 화면을 만든다. 작가 본인의 말에 "다수 의견 / 드문 읽기"가 붙던 문제를 고치고, 실제 시선이 모자란 책에만 AI 가 만든 해석을 덧붙인다. 비교와 끝 고르기는 spec-01-11 로 나눴다 (사용자 결정).

### 주요 변경 사항
- [x] **흔함 정도** (`domain/collection.ts`): 작가 본인이 아닌 시선에만. 흔함을 매길 때도 넘기지 않고 "다수 의견"을 말할 개수에도 세지 않는다. 이미 저장된 작가 본인의 값은 내주지 않는다
- [x] **AI 가 만든 해석** (`imagine.v1`, ADR-004 §6): 작가 본인을 뺀 다른 사람의 시선이 3개 미만이면 수집 끝에 모자란 만큼. 출처 없이 `perspectives.kind = 'imagined'` (0006, DB 제약). 실패해도 수집은 끝난다
- [x] **API** `GET /api/sessions/{id}/perspectives` (문): 수집 상태, 다른 사람(흔한 순), 작가 본인(흔함 없음), AI 가 만든 해석. 내 해석 전에는 `403 LOCKED`
- [x] **화면** `/sessions/{id}/perspectives`: 세 묶음, 흔함은 글자로만("많이 나온 읽기")과 "우열이 아니다" 안내, AI 해석은 "실제 사람의 글이 아니에요"와 AI 글 모양만. 배경 화면 끝에 "다른 시선 보기"
- [x] 배경 화면과 같은 부분을 `features/collection/` 으로 옮겨 함께 쓴다 (틀, 진행 상황, 다시 모으기, 인용과 출처)
- [x] backlog: 비교 spec-01-11, 토론 01-12, 노트 01-13. ADR-004 §6 기준 문장

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: 흐름의 4단계(다른 시선). 남은 B 구간은 비교(spec-01-11).

## 🎯 Key Review Points

1. **두 책의 실제 시선** (`docs/experiments/05-perspectives/README.md`): 다른 사람 9 / 17, 작가 본인 3 / 1. 기준을 넘어 AI 가 만든 해석은 만들어지지 않았다 (대역 LLM 테스트로만 확인).
2. **스크린숏**: `docs/design/screens/perspectives.png` (『채식주의자』, 내 해석은 나오지 않는 화면).
3. **E2E 고친 것**: 시험용 책 제목이 같은 밀리초에 겹쳐 실패하던 것(무작위 꼬리), 흐름 하나 제한 60초.
4. **이미 모은 흔함 값**: 작가 본인을 포함해 매긴 값을 그대로 쓴다. 다시 모으면 새 규칙으로 매겨진다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

**결과 요약**:
- ✅ lint, 타입 검사, 빌드
- ✅ Vitest 357개 (42 파일)
- ✅ Playwright 7개 (연속 세 번 통과)

### 수동 검증 시나리오
1. 내 해석 전 화면·API 잠김 (E2E)
2. 두 책의 시선: 흔한 순, 작가 본인 따로·흔함 없음 (실험 기록)
3. 실제 해석 원문 구절이 기록·스크린숏에 없음 (대조 일치 0)

## 📦 Files Changed

### 🆕 New Files
- `packages/backend/src/application/{perspectives.ts, prompts/imagine.v1.ts}`, `infrastructure/db/migrations/0006_imagined_perspectives.sql`
- `packages/contract/src/perspectives.ts`, `packages/backend/src/rpc/{perspectives.ts, quote-dto.ts}` (+ 테스트)
- `apps/web/src/features/perspectives/`, `apps/web/src/features/collection/`, `apps/web/src/app/sessions/[sessionId]/perspectives/page.tsx`
- `e2e/perspectives.spec.ts`, `docs/design/screens/perspectives.png`, `docs/experiments/05-perspectives/README.md`

### 🛠 Modified Files
- `packages/backend/src/domain/collection.ts`, `application/{collection.ts, connections.ts, ports.ts}`, 수집 저장소(Postgres·메모리·계약), 대역 LLM, 라우터, OpenAPI 스냅샷, `apps/api/src/cli/collect-report.ts`
- `apps/web/src/features/background/`, `apps/web/src/testing/fixtures.ts`, `e2e/test-book.ts`, `playwright.config.ts`
- `docs/architecture.md`, `README.md`, ADR-004 §6, ADR-001·002 의 spec 번호, `backlog/phase-01.md`

## ✅ Definition of Done

- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드와 E2E 통과
- [x] 두 책의 시선 화면 기록과 스크린숏
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-10-perspectives/walkthrough.md`
- 실험: `docs/experiments/05-perspectives/README.md`
- 아키텍처: `docs/architecture.md` §3 다른 시선

🤖 Generated with [Claude Code](https://claude.com/claude-code)
