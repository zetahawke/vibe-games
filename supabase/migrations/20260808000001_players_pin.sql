-- Add PIN hash column so players can recover their account from a new device.
alter table players add column if not exists pin_hash text not null default '';

-- Index for the recovery endpoint (username + pin_hash lookup).
create index if not exists players_pin_lookup on players (username, pin_hash);
