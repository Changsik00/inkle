<!-- HARNESS-KIT:BEGIN -->
@.harness-kit/CLAUDE.fragment.md
<!-- HARNESS-KIT:END -->

## 화면 작업 규칙

화면(`apps/web`)을 만들거나 고칠 때는 저장소 루트의 `DESIGN.md` 를 먼저 읽고 따른다 (ADR-011).

- 색, 글자 단계, 둥글기, 간격은 토큰 이름만 쓴다. 16진수 색이나 눈금 밖 값을 화면 코드에 쓰지 않는다.
- 새 값이 필요하면 `DESIGN.md` 에 토큰을 먼저 더하고 `apps/web/src/app/globals.css` 에 같은 값을 옮긴다.
- `DESIGN.md` §Do's and Don'ts 의 흔한 AI 기본값(보라 그라데이션, 그림자 카드, 가운데 정렬 히어로와 카드 셋, 크림 바탕과 주황 강조 등)을 쓰지 않는다.
- 고친 뒤 `pnpm lint` 와 `pnpm test` 를 돌린다 (DESIGN.md 형식 검사와 토큰 동기화 테스트가 함께 돈다).
