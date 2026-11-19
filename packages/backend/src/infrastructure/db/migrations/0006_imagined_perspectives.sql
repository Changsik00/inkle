-- AI 가 만든 해석 (ADR-004 §6, ADR-002 §2). 실제 사람의 시선이 모자랄 때만 덧붙인다.
-- 같은 시선 테이블에 종류로 둔다. 출처·인용·누가·어떤 사람이 없고, 흔함 정도는 언제나 알 수 없음이다.
-- 읽기 문장(reading_ko)의 글쓴이는 지금처럼 AI 다.

alter table perspectives
  add column kind text not null default 'external' check (kind in ('external', 'imagined'));

alter table perspectives
  alter column source_id drop not null,
  alter column who drop not null,
  alter column role drop not null;

alter table perspectives
  add constraint perspectives_kind_shape check (
    (kind = 'external' and source_id is not null and who is not null and role is not null)
    or (kind = 'imagined' and source_id is null and who is null and role is null and prevalence = 'unknown')
  );
