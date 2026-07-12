-- ============================================================
-- Product highlights
-- Replaces the hardcoded "Thoughtfully sourced materials / Cruelty free /
-- Eco-conscious packaging" bullets that used to render identically on
-- every PDP -- now a per-product, admin-editable list. `icon` is a key
-- into a small fixed icon set shared between the admin picker and the
-- PDP render (src/lib/highlightIcons.tsx), not free-text/SVG, to keep the
-- visual style consistent and avoid arbitrary markup input.
-- ============================================================

create table if not exists product_highlights (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  label text not null,
  icon text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_highlights_product on product_highlights (product_id);

alter table product_highlights enable row level security;

create policy "Public can view product highlights"
  on product_highlights for select
  to anon, authenticated
  using (true);

-- One-time seed: give every existing active product today's 3 default
-- bullets, so the PDP looks unchanged immediately after this migration
-- runs, until an admin customizes them per product.
insert into product_highlights (product_id, label, icon, sort_order)
select id, 'Thoughtfully sourced materials', 'leaf', 0 from products where status = 'active'
union all
select id, 'Cruelty free', 'rabbit', 1 from products where status = 'active'
union all
select id, 'Eco-conscious packaging', 'recycle', 2 from products where status = 'active';
