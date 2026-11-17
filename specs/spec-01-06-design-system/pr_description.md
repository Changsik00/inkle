# feat(spec-01-06): 디자인 시스템 — DESIGN.md 와 여백의 노트

## 📋 Summary

### 배경 및 목적

화면이 shadcn/ui 기본 테마 그대로라 "AI 가 만든 화면"처럼 보였고, 디자인 규칙이 문서로 없었다. Google 의 DESIGN.md 형식으로 규칙과 값을 저장소 루트에 쓰고, 화면 토큰이 그 값을 따르게 했다. 방향은 사용자가 고른 "여백의 노트".

### 주요 변경 사항
- [x] **`DESIGN.md`**: 색 22, 글자 단계 10, 둥글기, 간격, 부품 18. 절은 Google 형식 여덟 + Responsive Behavior, Iteration Guide(에이전트 규칙), Known Gaps. 형식 검사 오류·경고 0
- [x] **동기화**: `globals.css` 가 DESIGN.md 값을 그대로 따르고 `design-tokens.test.ts` 가 비교. `pnpm lint` 가 DESIGN.md 형식·대비도 검사
- [x] **여백의 노트**: 차가운 흰 종이, 잉크 버튼, 그림자 없음, 둥글기 4px 이하, 글쓴이 잉크(내 글 파랑, AI 흑연), 오류 색은 시스템 오류에만
- [x] **글꼴**: 명조 고운바탕(자체 호스팅), 고딕 시스템 글꼴. 견본을 보고 사용자가 고름
- [x] **한국어 조판**: 자간 0, 행간 1.75, `keep-all`, 제목 `balance`, 본문 `pretty`
- [x] **화면 적용**: 첫 화면(제품 이름은 작게), 책 목록(가는 선의 행), 책 등록, 책 정보. 스크린숏 `docs/design/screens/`
- [x] `CLAUDE.md` 에 화면 작업 규칙, ADR-011

### Phase 컨텍스트
- **Phase**: `phase-01`
- **본 SPEC 의 역할**: A 구간(기반)의 마지막. 이후 화면(내 해석, 배경, 시선, 비교)이 이 규칙 위에 선다.

## 🎯 Key Review Points

1. **스크린숏을 봐 달라** (`docs/design/screens/home.png`, `book-new.png`, `book-detail.png`).
2. **DESIGN.md 가 원본**이다. 값을 바꿀 때는 DESIGN.md 를 먼저 고치고 `globals.css` 에 옮긴다. 어긋나면 테스트가 실패한다.
3. **주 버튼은 잉크 검정**, 파랑은 "내가 쓴 글"에만.
4. **다크 모드를 뺐다.** shadcn 의 `.dark` 값을 지웠다.
5. **E2E 의 확인 문장 하나를 고쳤다.** 첫 화면의 제목이 "inkle" 에서 "모임을 열 책"으로 바뀌었다.

## 🧪 Verification

### 자동 테스트
```bash
docker compose up -d --wait
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

**결과 요약**:
- ✅ lint (ESLint, `@shadcn/lint`, DESIGN.md 형식 검사 오류·경고 0), 타입 검사, 빌드
- ✅ Vitest 142개 (22 파일)
- ✅ Playwright 4개

### 수동 검증 시나리오
1. **화면**: 스크린숏 셋
2. **원본 동기화**: DESIGN.md 의 `primary` 만 바꾸면 테스트가 실패 → 되돌림
3. **토큰 반영 구조**: 바뀌지 않음 (spec-01-04 에서 확인)
4. **Do's and Don'ts 대조**: 어긋나는 곳 없음. 입력 검사 상태의 빨간 이름을 찾아 고침

## 📦 Files Changed

### 🆕 New Files
- `DESIGN.md`, `docs/decisions/ADR-011-design-system.md`
- `apps/web/src/design-tokens.test.ts`, `docs/design/screens/*.png`

### 🛠 Modified Files
- `apps/web/src/app/globals.css` (토큰, 글자 단계, 조판 규칙), `layout.tsx` (고운바탕)
- `apps/web/src/ui/{button,input,card,field}.tsx`, `apps/web/src/features/**`, `apps/web/src/app/**`
- `e2e/smoke.spec.ts`, `CLAUDE.md`, 루트 `package.json` (`lint`, `design:lint`, `@google/design.md`), `apps/web/package.json` (`yaml`)
- `docs/architecture.md`, `README.md`, ADR-007

## ✅ Definition of Done

- [x] DESIGN.md 형식 검사에 오류 없음, 동기화 테스트 통과
- [x] 명조 글꼴을 사용자가 골라 적용
- [x] 화면 넷을 새 규칙으로 다듬음, 스크린숏
- [x] 모든 테스트 PASS, lint 와 타입 검사 통과, 빌드와 E2E 통과
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- `DESIGN.md`
- Walkthrough: `specs/spec-01-06-design-system/walkthrough.md`
- ADR: `docs/decisions/ADR-011-design-system.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
