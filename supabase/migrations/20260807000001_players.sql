-- Players: unique usernames with a localStorage session_token for ownership proof.
-- No passwords — the session_token (UUID) acts as a lightweight credential.
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique,
  -- UUID generated server-side and stored in client localStorage; proves username ownership.
  session_token  text not null,
  created_at     timestamptz not null default now(),
  last_seen      timestamptz not null default now()
);

alter table players enable row level security;
-- No anon policies = the anon key cannot read or write this table.
-- All access goes through Vercel Functions using SERVICE_ROLE_KEY.
