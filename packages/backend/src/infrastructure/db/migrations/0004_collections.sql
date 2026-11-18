-- 자료 수집 (ADR-004). 책 단위이고 독자와 무관하다 (ADR-002 §1).
-- 글쓴이: 설명·요약·옮김은 AI, 인용 원문은 바깥 사람 (ADR-002 §3).
-- 모든 항목은 어느 수집에서, 어느 모델과 지시문 판으로 만들었는지 갖는다 (ADR-005).

create table collections (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  error text,
  models jsonb not null default '[]',
  prompt_versions jsonb not null default '{}',
  -- CLI 가 보고한 비용 추정치의 합 (달러). 구독 실행이라 실제 청구액이 아니다
  cost_usd double precision not null default 0,
  candidate_count integer not null default 0,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz
);

create index collections_book_idx on collections (book_id, created_at desc);

-- 출처. 페이지 전체 글자를 보관한다: 다시 대조하고 다시 만들기 위해서다 (ADR-004 §8).
create table sources (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  collection_id uuid not null references collections (id) on delete cascade,
  book_id uuid not null references books (id),
  url text not null,
  final_url text,
  who text not null,
  role text not null check (role in ('background', 'perspective', 'both')),
  fetch_status text not null check (fetch_status in ('ok', 'unreachable')),
  fetch_error text,
  page_text text,
  article_text text,
  read_error text,
  fetched_at timestamptz not null default clock_timestamp()
);

create index sources_collection_idx on sources (collection_id, seq);

create table background_items (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  collection_id uuid not null references collections (id) on delete cascade,
  book_id uuid not null references books (id),
  source_id uuid not null references sources (id) on delete cascade,
  topic text not null check (topic in ('era', 'author_life', 'author_intent', 'other')),
  claim_ko text not null,
  author text not null default 'ai' check (author = 'ai'),
  model text not null,
  prompt_version text not null
);

create index background_items_collection_idx on background_items (collection_id, seq);

create table perspectives (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  collection_id uuid not null references collections (id) on delete cascade,
  book_id uuid not null references books (id),
  source_id uuid not null references sources (id) on delete cascade,
  who text not null,
  role text not null check (role in ('critic', 'author', 'reader', 'other')),
  reading_ko text not null,
  prevalence text not null default 'unknown' check (prevalence in ('majority', 'some', 'rare', 'unknown')),
  author text not null default 'ai' check (author = 'ai'),
  model text not null,
  prompt_version text not null
);

create index perspectives_collection_idx on perspectives (collection_id, seq);

-- 인용은 배경 항목이나 시선 가운데 하나에 붙는다.
create table quotes (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  source_id uuid not null references sources (id) on delete cascade,
  background_item_id uuid references background_items (id) on delete cascade,
  perspective_id uuid references perspectives (id) on delete cascade,
  text text not null,
  lang text not null,
  author text not null default 'external' check (author = 'external'),
  translation_ko text,
  translation_author text generated always as (case when translation_ko is null then null else 'ai' end) stored,
  source_kind text not null check (source_kind in ('direct', 'editorial', 'requote')),
  verified boolean not null,
  check ((background_item_id is null) <> (perspective_id is null))
);

create index quotes_background_idx on quotes (background_item_id, seq);
create index quotes_perspective_idx on quotes (perspective_id, seq);
