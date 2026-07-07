-- ============================================================
-- Catalog schema: categories, products, product images
-- ============================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  sku text unique,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_status on products (status);
create index if not exists idx_products_slug on products (slug);

create table if not exists product_categories (
  product_id uuid not null references products (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0
);

create index if not exists idx_product_images_product on product_images (product_id);

-- keep updated_at fresh on products
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- ============================================================
-- Row Level Security: catalog is public-read, admin-write only
-- ============================================================

alter table categories enable row level security;
alter table products enable row level security;
alter table product_categories enable row level security;
alter table product_images enable row level security;

-- Public can read active products and all categories/images.
-- Writes are only allowed via the service_role key (used server-side
-- in admin routes), which bypasses RLS entirely -- so no INSERT/UPDATE/DELETE
-- policies are defined for anon/authenticated roles on purpose.

create policy "Public can view categories"
  on categories for select
  to anon, authenticated
  using (true);

create policy "Public can view active products"
  on products for select
  to anon, authenticated
  using (status = 'active');

create policy "Public can view product-category links"
  on product_categories for select
  to anon, authenticated
  using (true);

create policy "Public can view product images"
  on product_images for select
  to anon, authenticated
  using (true);
