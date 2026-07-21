-- ============================================================
-- AKS — Migration: add per-card photo albums to Adventure Gallery
-- Run this in Supabase SQL Editor (safe to run even if you already
-- ran schema.sql or migration-trip-images.sql before).
-- ============================================================

create table if not exists gallery_images (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid references gallery(id) on delete cascade,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table gallery_images enable row level security;

drop policy if exists "public read gallery_images" on gallery_images;
create policy "public read gallery_images" on gallery_images for select using (true);

drop policy if exists "auth write gallery_images" on gallery_images;
create policy "auth write gallery_images" on gallery_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Give every existing gallery card its cover photo as the first album image,
-- so its popup isn't empty until you add more from the admin panel.
insert into gallery_images (gallery_id, image_url, sort_order)
select id, image_url, 1 from gallery
where not exists (select 1 from gallery_images gi where gi.gallery_id = gallery.id)
on conflict do nothing;
