-- All tables use UUIDs so no sequences needed, but grant schema usage and
-- table-level privileges so the service_role key can bypass RLS correctly.
grant usage on schema public to anon, authenticated, service_role;

grant all on table players             to service_role;
grant all on table seasons             to service_role;
grant all on table game_sessions       to service_role;
grant all on table session_players     to service_role;
grant all on table scoreboard_entries  to service_role;

grant usage, select on all sequences in schema public to service_role;
