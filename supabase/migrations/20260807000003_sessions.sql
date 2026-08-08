-- Game sessions for online co-op (2-4 players), joined by a 4-digit code.
create table if not exists game_sessions (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid references seasons(id) on delete set null,
  code        char(4) not null unique,   -- 4-digit join code (human readable)
  status      text not null default 'open'
                check (status in ('open', 'active', 'closed')),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz,
  -- Updated by the host every ~30 s; allows stale-session detection.
  updated_at  timestamptz not null default now()
);

create index game_sessions_status_idx on game_sessions (status);

alter table game_sessions enable row level security;

-- One row per player in a session. Replaces the old player_count integer.
create table if not exists session_players (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references game_sessions(id) on delete cascade,
  player_id   uuid not null references players(id),
  is_host     boolean not null default false,
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  unique (session_id, player_id)
);

alter table session_players enable row level security;
-- No anon policies = deny all for anon key.
