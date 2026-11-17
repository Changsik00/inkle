-- 책 (ADR-002). 독자와 무관한 공유 자료라 사용자 식별자가 없다 (ADR-003).
-- key 는 정규화한 제목과 작가 (src/domain/book.ts 의 bookKey). 같은 책은 하나만 있다.
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  genre text not null check (genre in ('fiction')),
  key text not null unique,
  created_at timestamptz not null default clock_timestamp()
);

create index books_created_at_idx on books (created_at desc);
