-- ============================================================
-- Product options and variants
-- Lets a product define independent option types (e.g. "Size",
-- "Skin type"), each with several pickable values, and price/stock
-- every combination as its own SKU-level product_variants row
-- (full combination pricing, not "cheapest/priciest wins").
-- A product with no option types behaves exactly as before -- these
-- tables are purely additive.
-- ============================================================

create table if not exists product_option_types (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_option_types_product on product_option_types (product_id);

create table if not exists product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_type_id uuid not null references product_option_types (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_option_values_type on product_option_values (option_type_id);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text,
  price_cents integer not null check (price_cents >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product on product_variants (product_id);

-- Junction: which option value (one per option type) makes up a given
-- variant, e.g. variant "Small/Oily" -> {Size: Small, Skin type: Oily}.
create table if not exists product_variant_options (
  variant_id uuid not null references product_variants (id) on delete cascade,
  option_value_id uuid not null references product_option_values (id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create index if not exists idx_product_variant_options_value on product_variant_options (option_value_id);

-- Order history needs to remember which variant was purchased even if the
-- variant is later edited/deleted -- mirrors the existing product_name
-- snapshot pattern (variant_label is a snapshot, not a live join), while
-- variant_id is kept as a best-effort live reference for convenience.
alter table order_items add column if not exists variant_id uuid references product_variants (id) on delete set null;
alter table order_items add column if not exists variant_label text;

-- Optional display-only product fields shown in the PDP's "Additional
-- information" tab. Plain text, not structured/unit-aware -- consistent
-- with keeping this a simple display field rather than a calculator input.
alter table products add column if not exists weight_text text;
alter table products add column if not exists dimensions_text text;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table product_option_types enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table product_variant_options enable row level security;

create policy "Public can view product option types"
  on product_option_types for select
  to anon, authenticated
  using (true);

create policy "Public can view product option values"
  on product_option_values for select
  to anon, authenticated
  using (true);

create policy "Public can view product variants"
  on product_variants for select
  to anon, authenticated
  using (true);

create policy "Public can view product variant options"
  on product_variant_options for select
  to anon, authenticated
  using (true);

-- ============================================================
-- Atomic variant stock decrement
-- Separate from (and does not modify) the existing decrement_stock
-- function used for products without variants -- same atomic
-- UPDATE...WHERE guarantee against concurrent-order races, scoped to
-- product_variants.stock_qty instead of products.stock_qty.
-- ============================================================

create or replace function decrement_variant_stock(item_variant_id uuid, item_quantity integer)
returns boolean as $$
declare
  updated_rows integer;
begin
  update product_variants
  set stock_qty = stock_qty - item_quantity
  where id = item_variant_id
    and stock_qty >= item_quantity;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function decrement_variant_stock(uuid, integer) from anon, authenticated;
