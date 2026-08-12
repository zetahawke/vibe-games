-- Free avatar overlays (hat / shirt / pants) for profile customization.
alter table players add column if not exists avatar_hat text not null default 'none';
alter table players add column if not exists avatar_shirt text not null default 'none';
alter table players add column if not exists avatar_pants text not null default 'none';
