-- ============================================================
-- Purchase orders -- second piece of inventory management, after
-- suppliers. A purchase order records what was ordered from a supplier
-- and (eventually) received, mirroring orders/order_items' shape:
-- purchase_order_items snapshots product_name/variant_label as text at
-- add-time (same reasoning as order_items -- a line item should still
-- read correctly even if the product is later renamed or deleted) and
-- keeps nullable product_id/variant_id for a live link when available.
--
-- Scope for this pass: record-keeping only. Marking items received does
-- NOT touch products.stock_qty/product_variants.stock_qty yet -- that's
-- a deliberately separate follow-up once this is solid, not bundled in
-- here. There's also no destination/location field -- this app has no
-- multi-location concept anywhere, so a location picker would be fake.
--
-- status lifecycle: draft (being built) -> ordered (sent to supplier) ->
-- received (stock arrived) -> cancelled (escape hatch from either draft
-- or ordered). received/cancelled are terminal.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'ordered', 'received', 'cancelled')),
  reference_number text,
  note_to_supplier text,
  payment_terms text not null default 'none'
    check (payment_terms in ('none', 'cod', 'receipt', 'advance', 'net7', 'net15', 'net30', 'net45', 'net60')),
  currency text not null default 'eur',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- supplier_id is `on delete set null` (not cascade) -- deleting a
-- supplier shouldn't destroy purchasing history, same reasoning as
-- orders.client_id when a client is deleted.
create index if not exists idx_purchase_orders_supplier on purchase_orders (supplier_id);
create index if not exists idx_purchase_orders_status on purchase_orders (status);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  variant_id uuid references product_variants (id) on delete set null,
  product_name text not null,
  variant_label text,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_order_items_po on purchase_order_items (purchase_order_id);

-- Admin-only, same as suppliers -- no public read policy, accessed
-- exclusively via the service-role admin client.
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
