-- Seasons gate leaderboard visibility. No active season = no public leaderboard.
create table if not exists seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  is_active   boolean not null default true
);

-- Enforce at most one active season at a time.
create unique index seasons_active_idx on seasons (is_active) where is_active = true;

alter table seasons enable row level security;
-- No anon policies = deny all for anon key.
