-- ============================================================
-- AKS (Adventurous & Kreative Souls) — Supabase Schema
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- SITE SETTINGS (single row for hero/about/contact/footer) ----------
create table if not exists site_settings (
  id int primary key default 1,
  hero_title text default 'Explore The World',
  hero_subtitle text default 'Adventure, trekking & camping journeys crafted by AKS — Adventurous & Kreative Souls.',
  hero_image_url text default 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920',
  about_title text default 'Our Story',
  about_text text default 'AKS was born from a love of mountains, campfires and the open trail. We craft treks, camps and expeditions for souls who want to explore the world — not just see it.',
  about_image_url text default 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80',
  contact_phone text default '+91 98765 43210',
  contact_email text default 'explore@aksadventures.com',
  contact_address text default 'Dehradun, Uttarakhand, India',
  contact_hours text default 'Mon - Sat: 9:00 AM - 7:00 PM',
  footer_text text default 'Adventurous & Kreative Souls — crafting treks, camps and journeys that bring you closer to the wild.',
  constraint single_row check (id = 1)
);
insert into site_settings (id) values (1) on conflict (id) do nothing;

-- ---------- GALLERY ----------
create table if not exists gallery (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- UPCOMING TRIPS ----------
create table if not exists trips (
  id uuid primary key default uuid_generate_v4(),
  category text,
  title text not null,
  description text,
  price text,
  image_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (anon) can only READ. Only logged-in admin can write.
-- ============================================================
alter table site_settings enable row level security;
alter table gallery enable row level security;
alter table trips enable row level security;

drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select using (true);
drop policy if exists "auth update settings" on site_settings;
create policy "auth update settings" on site_settings for update using (auth.role() = 'authenticated');

drop policy if exists "public read gallery" on gallery;
create policy "public read gallery" on gallery for select using (true);
drop policy if exists "auth write gallery" on gallery;
create policy "auth write gallery" on gallery for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public read trips" on trips;
create policy "public read trips" on trips for select using (true);
drop policy if exists "auth write trips" on trips;
create policy "auth write trips" on trips for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET for uploaded images (gallery/trip/hero photos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('aks-images', 'aks-images', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects
  for select using (bucket_id = 'aks-images');

drop policy if exists "auth upload images" on storage.objects;
create policy "auth upload images" on storage.objects
  for insert with check (bucket_id = 'aks-images' and auth.role() = 'authenticated');

drop policy if exists "auth delete images" on storage.objects;
create policy "auth delete images" on storage.objects
  for delete using (bucket_id = 'aks-images' and auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA (starter gallery + trips so the site isn't empty)
-- ============================================================
insert into gallery (title, subtitle, image_url, sort_order) values
('Himalayan Base Camp', 'Trek into the clouds', 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600', 1),
('Riverside Camping', 'Nights under the stars', 'https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600', 2),
('Forest Trail', 'Deep into the wild', 'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600', 3),
('Cliffside Views', 'Where the trail meets the sky', 'https://images.pexels.com/photos/1671324/pexels-photo-1671324.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600', 4),
('Lakeside Basecamp', 'Still waters, wild hearts', 'https://images.pexels.com/photos/1450082/pexels-photo-1450082.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600', 5),
('Sunrise Summit', 'Every peak has a story', 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600', 6)
on conflict do nothing;

insert into trips (category, title, description, price, image_url, sort_order) values
('HIMALAYAN TREK', 'Kedarkantha Trek', 'A snow-clad winter trek through pine forests to a 360° Himalayan summit.', '₹8,500', 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600', 1),
('WEEKEND CAMP', 'Rishikesh River Camp', 'Riverside camping with bonfire nights and white-water rafting by day.', '₹3,200', 'https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600', 2),
('JUNGLE EXPEDITION', 'Western Ghats Trail', 'Dense forest trails, waterfalls and wildlife spotting in monsoon green.', '₹5,400', 'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600', 3)
on conflict do nothing;
