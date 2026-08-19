-- IHKS 2026 Interactive Schedule — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query) before seeding.

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  day date not null,
  date_label text not null,
  track text not null,
  room text,
  start_time text,
  end_time text,
  title text not null,
  type text default 'session',
  speakers text[] default '{}',
  chairman text,
  co_chairman text,
  moderator text,
  course_director text,
  pic_name text,
  assist_pic_name text,
  notes text,
  updated_at timestamptz default now()
);

create index if not exists events_day_idx on events (day);
create index if not exists events_track_idx on events (track);

-- Keep updated_at fresh on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_updated_at on events;
create trigger trg_events_updated_at
before update on events
for each row execute function set_updated_at();

-- Directory of LO / PIC team members, used to populate the assignment dropdowns.
create table if not exists pic_directory (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  notes text
);

insert into pic_directory (name) values
  ('Radit'), ('Kynthia'), ('Mufida'), ('Talita'), ('Nadhifa'),
  ('Putri'), ('Wardah'), ('Anin'), ('Satria Prawira Putra'),
  ('Mohammad Triadi Wijaya'), ('Auliya Akbar')
on conflict (name) do nothing;

-- Row Level Security: per the app's requirements, the schedule is publicly readable
-- and publicly editable (no login gate) since it is meant for an internal committee
-- working from a shared link. Tighten this later with Supabase Auth policies if the
-- link ever needs to be shared outside the committee.
alter table events enable row level security;
alter table pic_directory enable row level security;

drop policy if exists "public read events" on events;
create policy "public read events" on events for select using (true);

drop policy if exists "public write events" on events;
create policy "public write events" on events for update using (true) with check (true);

drop policy if exists "public insert events" on events;
create policy "public insert events" on events for insert with check (true);

drop policy if exists "public read pic_directory" on pic_directory;
create policy "public read pic_directory" on pic_directory for select using (true);

drop policy if exists "public write pic_directory" on pic_directory;
create policy "public write pic_directory" on pic_directory for insert with check (true);
