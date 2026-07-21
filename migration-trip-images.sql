-- ============================================================
-- AKS — Migration: add per-trip photo galleries
-- Run this ONLY IF you already ran the original schema.sql before.
-- (If you're setting up fresh, just run the updated schema.sql —
--  it already includes this table.)
-- ============================================================

create table if not exists trip_images (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table trip_images enable row level security;

drop policy if exists "public read trip_images" on trip_images;
create policy "public read trip_images" on trip_images for select using (true);

drop policy if exists "auth write trip_images" on trip_images;
create policy "auth write trip_images" on trip_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Give every existing trip its cover photo as the first gallery image,
-- so the "View Gallery" popup isn't empty until you add more from the admin panel.
insert into trip_images (trip_id, image_url, sort_order)
select id, image_url, 1 from trips
where not exists (select 1 from trip_images ti where ti.trip_id = trips.id)
on conflict do nothing;
