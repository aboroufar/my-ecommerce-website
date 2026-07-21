-- ============================================================
-- Rename customers -> clients (business-record vocabulary change)
-- and prepare customer_segments for the new query-editor UI.
--
-- MANUAL STEP: this file must be pasted into the Supabase SQL Editor
-- and run once -- there is no CLI/connection string wired up in the
-- dev environment. src/lib/supabase/types.ts has been hand-updated to
-- match this shape in the same commit.
-- ============================================================

-- ---- customers -> clients ----
alter table customers rename to clients;

alter table clients rename column client_id to display_id;
alter index idx_customers_client_id rename to idx_clients_display_id;
alter index idx_customers_stripe_customer_id rename to idx_clients_stripe_customer_id;

-- ---- FK columns pointing at clients.id ----
alter table addresses rename column customer_id to client_id;
alter index idx_addresses_customer rename to idx_addresses_client;
alter table addresses rename constraint addresses_customer_id_fkey to addresses_client_id_fkey;

alter table carts rename column customer_id to client_id;
alter index idx_carts_customer rename to idx_carts_client;
alter table carts rename constraint carts_customer_id_fkey to carts_client_id_fkey;

alter table orders rename column customer_id to client_id;
alter index idx_orders_customer rename to idx_orders_client;
alter table orders rename constraint orders_customer_id_fkey to orders_client_id_fkey;

alter table wishlist_items rename column customer_id to client_id;
alter table wishlist_items rename constraint wishlist_items_customer_id_fkey to wishlist_items_client_id_fkey;

-- ---- RLS policy renames (predicates auto-migrate with the column rename above) ----
alter policy "Customers can view own record" on clients rename to "Clients can view own record";
alter policy "Customers can update own record" on clients rename to "Clients can update own record";
alter policy "Customers can manage own addresses" on addresses rename to "Clients can manage own addresses";
alter policy "Customers can manage own cart" on carts rename to "Clients can manage own cart";
alter policy "Customers can manage own cart items" on cart_items rename to "Clients can manage own cart items";
alter policy "Customers can view own orders" on orders rename to "Clients can view own orders";
alter policy "Customers can view own order items" on order_items rename to "Clients can view own order items";
alter policy "Customers can manage own wishlist" on wishlist_items rename to "Clients can manage own wishlist";

-- ---- signup trigger ----
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.clients (id, email, display_id)
  values (new.id, new.email, generate_client_id());
  return new;
end;
$$ language plpgsql security definer set search_path = public;
-- generate_client_id() keeps its name -- it's a codegen utility, not
-- the renamed business-record concept.

-- ---- customer_segments -> client_segments, + query editor support ----
alter table customer_segments rename to client_segments;
alter table client_segments add column if not exists query_text text;
