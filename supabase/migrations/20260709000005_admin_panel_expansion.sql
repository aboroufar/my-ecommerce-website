-- ============================================================
-- Site settings (singleton)
-- Global values previously hardcoded across SiteHeader/SiteFooter/page
-- titles: site name, header contact info. A single row, enforced by a
-- fixed id so there's never more than one.
-- ============================================================

create table if not exists site_settings (
  id boolean primary key default true,
  site_name text not null default 'Storefront',
  header_email text not null default '',
  header_phone text not null default '',
  header_address text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

alter table site_settings enable row level security;

create policy "Public can view site settings"
  on site_settings for select
  to anon, authenticated
  using (true);

insert into site_settings (id, site_name, header_email, header_phone, header_address)
values (true, 'Storefront', 'hello@storefront.example', '001 23 456 78 910', '22ND ST EAST VILLAGE')
on conflict (id) do nothing;

-- ============================================================
-- Homepage sections
-- Lets an admin enable/disable and reorder homepage sections without a
-- code deploy. The homepage renders whichever sections are enabled, in
-- sort_order, via a key-to-component map -- adding a brand-new *type*
-- of section still requires code, but toggling/reordering existing ones
-- doesn't.
-- ============================================================

create table if not exists homepage_sections (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0
);

alter table homepage_sections enable row level security;

create policy "Public can view homepage sections"
  on homepage_sections for select
  to anon, authenticated
  using (true);

insert into homepage_sections (key, label, enabled, sort_order) values
  ('hero', 'Hero slideshow', true, 0),
  ('category_grid', 'Category grid', true, 1),
  ('sale', 'Products on sale', true, 2),
  ('best_sellers', 'Top bestsellers', true, 3),
  ('brand_bar', 'Brand bar', true, 4),
  ('product_marquee', 'Product marquee', true, 5)
on conflict (key) do nothing;

-- ============================================================
-- Category photo
-- Dedicated admin-uploaded photo per category, decoupled from product
-- photos. CategoryGrid prefers this over borrowing a product's image.
-- ============================================================

alter table categories add column if not exists image_url text;

-- ============================================================
-- Mega menu columns and items
-- Replaces MegaMenu's hardcoded placeholder "Concern"/"Product" columns
-- (which showed fabricated data with no real links) with real,
-- admin-managed columns and links.
-- ============================================================

create table if not exists menu_columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references menu_columns(id) on delete cascade,
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table menu_columns enable row level security;
alter table menu_items enable row level security;

create policy "Public can view menu columns"
  on menu_columns for select
  to anon, authenticated
  using (true);

create policy "Public can view menu items"
  on menu_items for select
  to anon, authenticated
  using (true);

-- ============================================================
-- Brands
-- Real partner/brand logos for the homepage brand bar -- an admin
-- uploads the logo and (optionally) a link. No brand bar renders until
-- at least one real brand exists, same no-fabrication pattern as every
-- other section in this app.
-- ============================================================

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  link_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table brands enable row level security;

create policy "Public can view brands"
  on brands for select
  to anon, authenticated
  using (true);

-- All write access for the tables above goes through service_role only
-- (no anon/authenticated insert/update/delete policies), same trust
-- boundary as every other admin-managed table in this app.
