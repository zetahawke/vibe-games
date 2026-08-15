-- Gems + cosmetic inventory + hair slot
alter table players add column if not exists gems integer not null default 0;
alter table players add column if not exists avatar_hair text not null default 'none';
alter table players add column if not exists cosmetic_inventory jsonb not null default '{}'::jsonb;
