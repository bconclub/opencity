-- Apply with the Supabase SQL editor or `supabase db push` on your own project.
begin;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
 favorite_vehicle text check (favorite_vehicle in ('auto','helicopter','cycle','drone','supercar','cab','yulu','bike','delivery')),
 created_at timestamptz not null default now()
);

create table public.ride_sessions (
 id uuid primary key,
 player_id uuid not null references auth.users(id) on delete cascade,
 vehicle text not null check (vehicle in ('auto','helicopter','cycle','drone','supercar','cab','yulu','bike','delivery')),
 started_at timestamptz not null,
 ended_at timestamptz,
 active_seconds numeric not null default 0 check (active_seconds between 0 and 86400),
 flight_seconds numeric not null default 0 check (flight_seconds between 0 and active_seconds),
 distance_m numeric not null default 0 check (distance_m between 0 and 20000000),
 check (ended_at is null or ended_at >= started_at),
 check (vehicle in ('helicopter','drone') or flight_seconds = 0)
);
create index ride_sessions_player_started on public.ride_sessions(player_id, started_at desc);

create table public.meetups (
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null references auth.users(id) on delete cascade,
 host_name text not null default 'OpenCity host' check (char_length(host_name) between 1 and 24),
 expected_attendance integer not null default 8 check (expected_attendance between 1 and 8),
 title text not null check (char_length(btrim(title)) between 1 and 120),
 description text not null default '' check (char_length(description) <= 3000),
 starts_at timestamptz not null,
 ends_at timestamptz not null check (ends_at > starts_at),
 published boolean not null default false,
 created_at timestamptz not null default now()
 -- Private multiplayer invite codes intentionally do not belong in public events.
);
create index meetups_public_start on public.meetups(starts_at) where published;

create table public.meetup_registrations (
 meetup_id uuid not null references public.meetups(id) on delete cascade,
 player_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'going' check (status in ('going','interested','cancelled')),
 created_at timestamptz not null default now(),
 primary key(meetup_id, player_id)
);
create index meetup_registrations_player on public.meetup_registrations(player_id);

alter table public.profiles enable row level security;
alter table public.ride_sessions enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_registrations enable row level security;

create policy profiles_own_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_own_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_own_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_own_delete on public.profiles for delete to authenticated using (id = (select auth.uid()));
create policy rides_own_read on public.ride_sessions for select to authenticated using (player_id = (select auth.uid()));
create policy rides_own_insert on public.ride_sessions for insert to authenticated with check (player_id = (select auth.uid()));
create policy rides_own_update on public.ride_sessions for update to authenticated using (player_id = (select auth.uid())) with check (player_id = (select auth.uid()));
create policy rides_own_delete on public.ride_sessions for delete to authenticated using (player_id = (select auth.uid()));

create policy meetups_visible on public.meetups for select to anon, authenticated using (published or host_id = (select auth.uid()));
create policy meetups_host_insert on public.meetups for insert to authenticated with check (host_id = (select auth.uid()));
create policy meetups_host_update on public.meetups for update to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy meetups_host_delete on public.meetups for delete to authenticated using (host_id = (select auth.uid()));
create policy registrations_own_or_host_read on public.meetup_registrations for select to authenticated using (
 player_id = (select auth.uid()) or exists(select 1 from public.meetups m where m.id = meetup_id and m.host_id = (select auth.uid()))
);
create policy registrations_own_insert on public.meetup_registrations for insert to authenticated with check (
 player_id = (select auth.uid()) and exists(select 1 from public.meetups m where m.id = meetup_id and (m.published or m.host_id = (select auth.uid())))
);
create policy registrations_own_update on public.meetup_registrations for update to authenticated using (player_id = (select auth.uid())) with check (
 player_id = (select auth.uid()) and exists(select 1 from public.meetups m where m.id = meetup_id and (m.published or m.host_id = (select auth.uid())))
);
create policy registrations_own_delete on public.meetup_registrations for delete to authenticated using (player_id = (select auth.uid()));

-- Explicit grants avoid relying on a project's default table privileges.
revoke all on public.profiles,public.ride_sessions,public.meetups,public.meetup_registrations from anon,authenticated;
grant select,insert,update,delete on public.profiles,public.ride_sessions,public.meetups,public.meetup_registrations to authenticated;
grant select on public.meetups to anon;

-- Invoker view retains the caller's RLS, unlike a definer-owned aggregate view.
create view public.player_vehicle_stats with (security_invoker=true) as
 select player_id,vehicle,count(*) as ride_count,sum(active_seconds) as active_seconds,
 sum(flight_seconds) as flight_seconds,sum(distance_m) as distance_m
 from public.ride_sessions group by player_id,vehicle;
revoke all on public.player_vehicle_stats from anon;
grant select on public.player_vehicle_stats to authenticated;
commit;

