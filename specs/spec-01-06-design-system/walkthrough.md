# Walkthrough: spec-01-06

> 결정 과정, 사용자 협의, 검증 결과를 미래의 자신과 리뷰어에게 남깁니다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 방향 | 여백의 노트 / 도서관 카드 / 잡지 편집 | 여백의 노트 | 사용자 선택 (spec 이전, 2026-11-17) |
| 값의 원본 | `globals.css` / `DESIGN.md` | `DESIGN.md`, 테스트로 동기화 | 사람과 에이전트가 읽는 규칙, 형식·대비 검사가 DESIGN.md 쪽에 있다 |
| 참고 자료 | - | Google DESIGN.md 형식, VoltAgent/awesome-design-md(Notion, WIRED, Claude), Apple 한국 사이트 CSS, W3C klreq, Pretendard | 사용자 요청 ("자간 등 설정할 게 많으니 잘 정리된 것을 참고") |
| 명조 | Noto Serif KR / 고운바탕 / 함렛 | 고운바탕 (400) | 사용자 선택. 견본에서 가장 가볍고(96 KB) 연필 느낌에 맞음 |
| 고딕 | 시스템 / Pretendard | 시스템 | 사용자 선택. 내려받는 글꼴 없음. 배포 때 다시 본다 |
| 주 버튼 색 | 파랑 / 잉크 검정 | 잉크 검정 | 파랑은 "내가 쓴 글"에만 쓴다 |
| 오류 색 | 빨강 / 벽돌색, 시스템 오류만 | `#A33A2B`, 입력 검사와 시스템 오류만 | 독자의 글을 채점처럼 보이지 않게 |
| 그림자, 둥글기 | shadcn 기본 / 없음, 4px 이하 | Tailwind 테마에서 그림자를 없애고 둥글기 단계를 4px 로 묶음 | 부품 코드를 덜 고치고 토큰으로 따라오게 |
| 오류 표시 범위 | 이름·선·문장 모두 빨강 / 선과 문장만 | 선과 문장만, 입력란의 빨간 번짐 제거 | DESIGN.md §Components. 스크린숏을 보고 고쳤다 |
| 첫 화면 제목 | "inkle" 큰 제목 / "모임을 열 책" | "모임을 열 책" (제품 이름은 작게) | DESIGN.md §Layout. E2E 의 확인 문장 하나를 고쳤다 |
| 다크 모드 | 남김 / 지움 | 지움 (`.dark` 값 삭제, `dark:` 는 `.dark` 클래스에서만) | 밝은 테마만 설계했다. 운영체제 다크 설정으로 반쪽만 바뀌는 일을 막는다 |

새 ADR: ADR-011.

## 💬 사용자 협의

- **주제**: 참고 자료 (Plan 단계)
  - **합의**: awesome-design-md 와 한국어 조판 자료를 읽고 글자 단계(크기·굵기·행간·자간), 한국어 줄바꿈, Iteration Guide·Known Gaps 절을 spec 에 넣었다.
- **주제**: 글꼴 (Task 3, 사용자 결정 지점)
  - **합의**: 견본 넷(명조 셋, 고딕 비교 하나)을 보고 고운바탕과 시스템 고딕을 골랐다.

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`
- **결과**: ✅ Passed
```text
 Test Files  22 passed (22)
      Tests  142 passed (142)
  4 passed (Playwright)
DESIGN.md lint: errors 0, warnings 0
```

### 수동 검증
1. **화면**: 첫 화면, 책 등록(입력 검사 상태), 책 정보를 찍었다 (`docs/design/screens/`). 그림자 카드와 회색 기본 테마가 없고 책 제목이 명조다.
2. **원본 동기화**: DESIGN.md 의 `primary` 만 바꾸자 동기화 테스트가 `expected #1d1f22 to equal #203040` 으로 실패했다. 되돌렸다.
3. **토큰 한곳 변경**: `globals.css` 의 토큰이 화면에 반영되는 구조는 spec-01-04 에서 확인했고 바뀌지 않았다 (토큰 이름은 그대로).
4. **Do's and Don'ts 대조**: 스크린숏에 그라데이션, 그림자, 가운데 정렬 히어로, 이모지, 크림·주황, 알약 버튼이 없다. 입력 검사 상태에서 이름까지 빨개지던 것을 찾아 고쳤다.

## 🔍 발견 사항

- **API 컨테이너의 `tsx watch` 가 죽고 살아나지 않았다.** 브랜치를 오가며 파일이 잠깐 사라졌을 때다. `docker compose restart api` 로 되살렸다. 개발 중에만 생기는 일이라 고치지 않았다.
- **고운바탕은 굵기 400/700 뿐**이라 명조 단계(display, title-book)의 굵기를 500 에서 400 으로 바꿨다.
- **견본에서 잰 글꼴 크기**: Noto Serif KR 199 KB, 고운바탕 96 KB, 함렛 245 KB, Pretendard 를 더하면 약 +300 KB (그 화면에 쓰인 글자 기준).
- shadcn/ui 부품 가운데 `card` 는 이제 쓰지 않는다 (목록이 행이 되었다). 지우지 않고 선 스타일로만 바꿨다.
- 스크린숏의 왼쪽 아래 "N" 은 Next.js 개발 표시다.

## 🚧 이월 항목

- 글쓴이 표시 컴포넌트 → spec-01-10 (토큰과 규칙은 이번에 정함)
- 다크 모드, 움직임 → DESIGN.md §Known Gaps
- Pretendard → 배포 때
