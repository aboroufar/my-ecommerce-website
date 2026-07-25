-- ============================================================
-- Atomic stock increment ("restock"), mirroring decrement_stock /
-- decrement_variant_stock exactly (20260705000001_atomic_stock_decrement.sql,
-- 20260713000001_product_variants.sql) -- same security definer +
-- revoke pattern, called only from the refund action's service-role
-- client, never from anon/authenticated. Unlike decrement, there's no
-- "insufficient" failure mode to report (a plain increment can't fail
-- a bounds check the way a decrement can), so this always returns true
-- when the row exists, false only if item_product_id/item_variant_id
-- doesn't match any row.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- ============================================================

create or replace function increment_stock(item_product_id uuid, item_quantity integer)
returns boolean as $$
declare
  updated_rows integer;
begin
  update products
  set stock_qty = stock_qty + item_quantity
  where id = item_product_id;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function increment_stock(uuid, integer) from anon, authenticated;

create or replace function increment_variant_stock(item_variant_id uuid, item_quantity integer)
returns boolean as $$
declare
  updated_rows integer;
begin
  update product_variants
  set stock_qty = stock_qty + item_quantity
  where id = item_variant_id;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function increment_variant_stock(uuid, integer) from anon, authenticated;
