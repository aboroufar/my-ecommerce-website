-- Admin-settable "Popular" badge, same pattern as the existing status
-- field -- toggled from the product edit form, not derived automatically.
alter table products
  add column if not exists is_popular boolean not null default false;

-- Wishlist: customers can favorite products, persisted server-side so it
-- follows them across devices. Mirrors the addresses/cart_items pattern
-- (customer-owned row, RLS scoped to auth.uid()).
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

alter table wishlist_items enable row level security;

create policy "Customers can manage own wishlist"
  on wishlist_items for all
  to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());
