-- Scoreboard: one entry per player per session on exit/disconnect.
-- player_count is snapshot-recorded so rankings (solo / 2p / 3p / 4p) are stable
-- even if the session_players rows change later.
create table if not exists scoreboard_entries (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references game_sessions(id) on delete cascade,
  season_id       uuid references seasons(id) on delete set null,
  player_id       uuid not null references players(id),
  -- Snapshot of how many players were in the session when this entry was recorded.
  player_count    smallint not null check (player_count between 1 and 4),
  -- Score of the whole session at time of this player's exit.
  session_score   integer not null default 0,
  -- Score accumulated by this player alone.
  personal_score  integer not null default 0,
  coins_earned    integer not null default 0,
  coins_spent     integer not null default 0,
  last_weapon     text not null default 'knife',
  subject         text not null default 'math',
  grade           text not null default '7th',
  recorded_at     timestamptz not null default now()
);

-- Efficient leaderboard queries: season → player count → top personal scores.
create index scoreboard_season_idx
  on scoreboard_entries (season_id, player_count, personal_score desc);

alter table scoreboard_entries enable row level security;
-- No anon policies = deny all for anon key.
