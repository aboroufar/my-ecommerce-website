-- Atomic stock decrement, safe under concurrent orders for the same product.
-- Returns true if stock was sufficient and decremented, false otherwise
-- (caller can then decide how to handle an oversell/backorder situation).
create or replace function decrement_stock(item_product_id uuid, item_quantity integer)
returns boolean as $$
declare
  updated_rows integer;
begin
  update products
  set stock_qty = stock_qty - item_quantity
  where id = item_product_id
    and stock_qty >= item_quantity;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$ language plpgsql security definer set search_path = public;

-- Only callable server-side (service_role bypasses RLS/grants anyway, but
-- being explicit here documents intent).
revoke execute on function decrement_stock(uuid, integer) from anon, authenticated;
