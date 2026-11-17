-- 모임 (ADR-002 독자 단위, ADR-003 사용자 식별자). 한 독자가 한 책을 두고 연 한 번의 모임.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  book_id uuid not null references books (id),
  created_at timestamptz not null default clock_timestamp()
);

create index sessions_user_book_idx on sessions (user_id, book_id, created_at desc);

-- 내 해석의 판 (ADR-005 원본: 고치지 않고 덧붙이기만). 글쓴이는 언제나 나 (ADR-002 §3).
create table interpretation_versions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  version integer not null check (version >= 1),
  question_set text not null,
  answers jsonb not null,
  author text not null default 'me' check (author = 'me'),
  created_at timestamptz not null default clock_timestamp(),
  unique (session_id, version)
);
