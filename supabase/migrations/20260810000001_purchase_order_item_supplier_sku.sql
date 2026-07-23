-- ============================================================
-- Adds supplier_sku to purchase_order_items -- the supplier's own SKU
-- for a line item, distinct from this store's product/variant SKU
-- (products.sku / product_variants.sku), which the supplier doesn't
-- necessarily use. Purely informational, no code reads it besides the
-- purchase order form/detail views.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

alter table purchase_order_items
  add column if not exists supplier_sku text;
