-- 사용자 (ADR-003). 지금은 로컬 사용자 한 명만 있다.
create table users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at timestamptz not null default now()
);

insert into users (id, display_name)
values ('00000000-0000-4000-8000-000000000001', '로컬 사용자');

-- 작업 대기열 (ADR-001). 웹 앱이 넣고 작업 프로세스가 가져간다.
create table jobs (
  id bigint generated always as identity primary key,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index jobs_queued_idx on jobs (created_at) where status = 'queued';
