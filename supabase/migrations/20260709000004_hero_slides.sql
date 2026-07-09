-- ============================================================
-- Hero slideshow slides
-- Admin-manageable replacement for the hardcoded category slideshow on
-- the homepage. Each slide links to one real category (not a freeform
-- URL) so "Read more" always resolves to a real, filtered product
-- listing rather than an arbitrary link an admin could mistype.
-- ============================================================

create table if not exists hero_slides (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  headline text not null,
  description text not null default '',
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table hero_slides enable row level security;

-- Public read (rendered on the homepage via the anon-key public client,
-- same as products/categories/site_content). Writes go through
-- service_role only -- no anon/authenticated write policy, consistent
-- with every other admin-managed table in this app.

create policy "Public can view hero slides"
  on hero_slides for select
  to anon, authenticated
  using (true);
