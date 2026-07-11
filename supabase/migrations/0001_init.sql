-- Spartan League 2 — core schema.
-- One JSONB "season" document holds everything the admin manages (teams, slots, results,
-- announcements, stats imports, manual record overrides). Poll votes live in their own
-- table so many viewers can vote concurrently without racing writes to the season row.

create table if not exists season (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint season_singleton check (id = 1)
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  slot_id text not null,
  team_id text not null,
  viewer_id text not null,
  created_at timestamptz not null default now(),
  unique (slot_id, viewer_id)
);

alter table season enable row level security;
alter table poll_votes enable row level security;

-- Season: anyone can read (this is what every viewer's app loads); only a signed-in
-- admin session (created via the admin-login Edge Function after a correct PIN) can write.
create policy "season_public_read" on season for select using (true);
create policy "season_admin_write" on season for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Poll votes: anyone can read aggregated counts and cast one vote per (slot, viewer).
-- The unique constraint above is what actually prevents a double vote from the same browser.
create policy "poll_votes_public_read" on poll_votes for select using (true);
create policy "poll_votes_public_insert" on poll_votes for insert with check (true);

-- Realtime: push season changes to every connected viewer.
alter publication supabase_realtime add table season;
alter publication supabase_realtime add table poll_votes;

-- Storage: player/team photos, public read, admin-only write.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_public_read" on storage.objects for select
  using (bucket_id = 'photos');
create policy "photos_admin_write" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "photos_admin_update" on storage.objects for update
  using (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "photos_admin_delete" on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');

-- Seed the single season row if it doesn't exist yet. The app also does this on first
-- load, but seeding here means the row exists before anyone opens the app.
insert into season (id, data)
values (1, '{"teams":[],"slots":[],"statsImports":[],"announcements":[],"manualRecords":{"highestScore":null,"bestBowling":null},"polls":{},"liveScorecardUrl":""}'::jsonb)
on conflict (id) do nothing;
