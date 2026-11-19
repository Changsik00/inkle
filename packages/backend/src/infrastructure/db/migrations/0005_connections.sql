-- 연결 (ADR-002 독자 단위). 책 단위 배경 항목 하나가 내 해석의 어느 부분과 맞닿는지.
-- 사용자 식별자는 모임을 거쳐 이어진다 (sessions.user_id, ADR-003).
-- 내 해석의 판 하나에 대해 만들고, 다시 만들어도 이전 것은 지우지 않는다 (ADR-005).

create table connection_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  interpretation_version integer not null check (interpretation_version >= 1),
  collection_id uuid not null references collections (id),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  error text,
  model text,
  prompt_version text not null,
  -- CLI 가 보고한 비용 추정치 (달러). 구독 실행이라 실제 청구액이 아니다
  cost_usd double precision not null default 0,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz,
  foreign key (session_id, interpretation_version) references interpretation_versions (session_id, version)
);

create index connection_runs_session_idx on connection_runs (session_id, interpretation_version, created_at desc);

create table connections (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  run_id uuid not null references connection_runs (id) on delete cascade,
  session_id uuid not null references sessions (id) on delete cascade,
  background_item_id uuid not null references background_items (id),
  -- 내 답에서 옮긴 구절. 글쓴이는 나
  my_quote text not null,
  my_quote_author text not null default 'me' check (my_quote_author = 'me'),
  -- 구절이 있는 질문. 대조에 실패했으면 없다
  question_id text,
  -- 어떻게 맞닿는지. 글쓴이는 AI
  note_ko text not null,
  note_author text not null default 'ai' check (note_author = 'ai'),
  verified boolean not null,
  check (verified = (question_id is not null))
);

create index connections_run_idx on connections (run_id, seq);
