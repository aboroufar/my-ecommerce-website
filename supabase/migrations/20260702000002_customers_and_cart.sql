-- ============================================================
-- Customers, addresses, carts
-- customers.id is the same id as auth.users.id (1:1 with Supabase Auth)
-- ============================================================

create table if not exists customers (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_customer on addresses (customer_id);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  -- a cart belongs to either a logged-in customer or an anonymous session, not both/neither
  constraint chk_cart_owner check (
    (customer_id is not null and session_id is null)
    or (customer_id is null and session_id is not null)
  )
);

create index if not exists idx_carts_customer on carts (customer_id);
create index if not exists idx_carts_session on carts (session_id);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  unique (cart_id, product_id)
);

create index if not exists idx_cart_items_cart on cart_items (cart_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table customers enable row level security;
alter table addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;

-- Customers can only see/edit their own record
create policy "Customers can view own record"
  on customers for select
  to authenticated
  using (id = auth.uid());

create policy "Customers can update own record"
  on customers for update
  to authenticated
  using (id = auth.uid());

-- Addresses: owned entirely by the customer
create policy "Customers can manage own addresses"
  on addresses for all
  to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Carts: logged-in customers can manage their own cart.
-- Anonymous/guest carts (session_id-based) are handled via the
-- server (service_role key) rather than direct client RLS access,
-- since there's no auth.uid() to check against for guests.
create policy "Customers can manage own cart"
  on carts for all
  to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "Customers can manage own cart items"
  on cart_items for all
  to authenticated
  using (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and carts.customer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from carts
      where carts.id = cart_items.cart_id
      and carts.customer_id = auth.uid()
    )
  );

-- Auto-create a `customers` row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.customers (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();
