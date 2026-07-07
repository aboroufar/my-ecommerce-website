-- ============================================================
-- Orders and order line items
-- Orders are created server-side (service_role) once Stripe
-- confirms payment, so customers only ever get read access here.
-- ============================================================

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'usd',
  stripe_payment_intent_id text unique,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on orders (customer_id);
create index if not exists idx_orders_status on orders (status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,       -- snapshot, in case the product is later renamed/removed
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create index if not exists idx_order_items_order on order_items (order_id);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table orders enable row level security;
alter table order_items enable row level security;

-- Customers can view their own orders (read-only -- all writes go
-- through the server using the service_role key after Stripe webhook
-- confirmation, never directly from the client).
create policy "Customers can view own orders"
  on orders for select
  to authenticated
  using (customer_id = auth.uid());

create policy "Customers can view own order items"
  on order_items for select
  to authenticated
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
    )
  );
