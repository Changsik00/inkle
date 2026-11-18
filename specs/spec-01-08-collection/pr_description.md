# feat(spec-01-08): 자료 수집

## 📋 Summary

### 배경 및 목적

inkle 은 내 해석을 작품의 배경과 다른 사람들의 실제 시선에 비춰 본다. 수동 실험에서 검색 요약만 믿으면 출처 7개 중 2개가 틀린 내용으로 나갔다. 이 spec 은 ADR-004 의 수집(찾기 → 가져오기 → 읽기 → 대조)을 만든다. 앱이 출처를 직접 열고, 인용이 그 페이지에 그대로 있는지 코드가 문자열로 확인한다. 화면은 없다.

### 주요 변경 사항
- [x] **수집 흐름** (`application/collection.ts`): 찾기(웹 검색만) → 가져오기(앱) → 읽기(도구 없음) → 대조 → 흔함 정도(보여 줄 시선이 셋 이상일 때). 단계마다 한 번 다시 묻기, 비용·모델·지시문 판 기록
- [x] **대조** (`domain/quote-match.ts`): 공백·따옴표·말줄임표만 너그럽게, 10자 미만은 통과 못 함. 통과한 인용이 없는 항목은 내주지 않음
- [x] **포트와 구현**: `LlmClient` → `ClaudeCodeCli` (빈 임시 디렉토리, MCP·사용자 설정 끔, API 키 안 넘김), `PageFetcher` → `HttpPageFetcher` (내부 주소 차단, 리디렉션마다 검사, EUC-KR, Readability), `CollectionRepository` → Postgres (`0004_collections.sql`)
- [x] **시작 시점**: 모임을 시작하면 그 책의 수집을 대기열에 넣는다 (책 단위, 한 번). 2시간 넘게 멈춘 수집은 막지 않음
- [x] **명령**: `pnpm collect <bookId> [--force]`, `pnpm collect:report <bookId> [--quotes]`
- [x] **실제 실행**: 『채식주의자』, 『노인과 바다』. 지시문 `find.v1` → `find.v2` (시선의 쏠림을 고침)

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: 배경(spec-01-09)과 시선(spec-01-10)이 함께 쓰는 책 단위 자료. 성공 기준 4(틀린 출처 0건)의 근거.

## 🎯 Key Review Points

1. **실제 수집 결과**: `docs/experiments/03-collection/README.md`. 책당 2~2.5분, 비용 추정치 0.4~0.6달러, 인용 대조 100%, 출처 9개 직접 확인에서 틀린 내용 0건.
2. **모델**: 기본 모델은 구독 사용량이 바닥나 `claude-sonnet-5-5`(`INKLE_LLM_MODEL`)로 돌렸다.
3. **find.v2**: v1 은 시선이 작가 본인 쪽으로 쏠렸다 (16개 중 11개). v2 에서 독자 시선이 늘었지만 배경 항목은 줄었다.
4. **한계**: 대조는 인용이 페이지에 있다는 것만 보장한다. 설명 일부가 인용 밖에서 나온 경우가 1건 있었다 (같은 글 안).
5. **CLI 격리**: 실제 실행 중 기기의 MCP 서버(Serena)가 호출마다 뜨던 문제를 `--strict-mcp-config --setting-sources ""` 로 막았다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

**결과 요약**:
- ✅ lint, 타입 검사, 빌드
- ✅ Vitest 279개 (35 파일)
- ✅ Playwright 5개

### 수동 검증 시나리오
1. 모임 시작 → 수집 한 번 (유스케이스 테스트, E2E)
2. 두 책 실제 수집과 보고서 (실험 기록)
3. 출처 9개 직접 확인, 틀린 내용 0건 (실험 기록 §직접 확인)
4. 수동 실험과 비교 (실험 기록)

## 📦 Files Changed

### 🆕 New Files
- `packages/backend/src/domain/{collection,quote-match}.ts` (+ 테스트)
- `packages/backend/src/application/collection.ts` (+ 테스트), `application/prompts/{find.v1,find.v2,read.v1,prevalence.v1}.ts`
- `packages/backend/src/infrastructure/{llm/claude-code-cli.ts, web/http-page-fetcher.ts}` (+ 테스트), `repositories/postgres-collection-repository.ts`, `db/migrations/0004_collections.sql`
- `packages/backend/src/testing/{contracts/collection-repository.contract.ts, in-memory/in-memory-collection-repository.ts, fakes/{llm,page-fetcher}.ts}`
- `packages/backend/src/worker/handlers.test.ts`, `apps/api/src/cli/{collect,collect-report}.ts`
- `docs/experiments/03-collection/README.md`

### 🛠 Modified Files
- `packages/backend/src/{application/ports.ts, application/sessions.ts, container.ts, worker/handlers.ts, testing/rpc.ts}`, 저장소 테스트 둘
- `apps/worker/src/main.ts`, `apps/api/package.json`, `package.json`
- `docs/architecture.md`, `docs/decisions/ADR-004-llm-grounding.md`, `README.md`, `backlog/phase-01.md`

## ✅ Definition of Done

- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드와 E2E 통과
- [x] 두 책의 실제 수집과 기록, 출처 직접 확인에서 틀린 것 0건
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md`
- Walkthrough: `specs/spec-01-08-collection/walkthrough.md`
- 결정: `docs/decisions/ADR-004-llm-grounding.md`
- 실험: `docs/experiments/03-collection/README.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
