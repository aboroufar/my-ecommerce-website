-- ============================================================
-- Reusable package profiles for product shipping
-- ============================================================
-- A named, structured shipping package (type + dimensions + empty weight)
-- that a product can reference instead of retyping the same box specs on
-- every product. Deliberately separate from products.weight_text/
-- dimensions_text, which stay freeform text for display on the PDP --
-- this table is structured data meant for reuse, not per-product display
-- copy. It is NOT wired into the Shippo rate-fetch flow in
-- src/lib/actions/orders.ts, which intentionally asks for parcel
-- weight/dimensions per-shipment (see the comment on fetchShippingRates).

create table if not exists package_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  package_type text not null default 'box'
    check (package_type in ('box', 'envelope', 'soft_package')),
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  empty_weight_grams numeric,
  created_at timestamptz not null default now()
);

alter table products
  add column if not exists package_profile_id uuid
    references package_profiles (id) on delete set null;

create index if not exists idx_products_package_profile_id
  on products (package_profile_id);

-- Unlike brands/menu_items/categories, package profiles are never rendered
-- on the storefront -- only read/written through the admin server actions,
-- which use the service-role client and so bypass RLS entirely. RLS is
-- still enabled with no policies (default-deny) so the anon/authenticated
-- roles used by public-facing queries can't read this table even by
-- accident.
alter table package_profiles enable row level security;
