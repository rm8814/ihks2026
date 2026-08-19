-- IHKS 2026 Interactive Schedule — Supabase schema (v2: per-person assignments)
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- If you're upgrading from the v1 schema (separate speakers/pic_name columns),
-- drop and recreate the events table -- the shape changed to support each
-- person on a session (speaker, chairman, moderator, course director, ...)
-- having their own independent PIC + assist-PIC, instead of one PIC per event.
-- That's what fixed the "PIC shown on the card doesn't say *whose* PIC it is"
-- ambiguity. Run `npm run seed` again afterward to reload data.

create extension if not exists "pgcrypto";

drop table if exists events;

create table events (
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
  notes text,
  done boolean not null default false,
  -- assignments: array of { name, role, pic, assist, phone, email, pic_inferred }
  --   role is one of: Speaker, Chairman, Co-Chairman, Moderator, Course Director
  --   pic / assist are LO names, or null if unassigned
  --   pic_inferred: true if the PIC was carried over from that same person's other
  --   sessions rather than an exact recap-sheet match for this exact session/time
  --   phone / email: from the committee's speaker contact sheet, when on file
  assignments jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

create index if not exists events_day_idx on events (day);
create index if not exists events_track_idx on events (track);
create index if not exists events_assignments_idx on events using gin (assignments);
create index if not exists events_done_idx on events (done);

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

-- Row Level Security: public read + write, no login gate (matches the "anyone
-- with the link can edit" choice made for this internal committee tool).
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
