-- ============================================================
-- Shopify-style discount types (Amount off products / Buy X get Y /
-- Amount off order / Free shipping), each with its own applies-to
-- scope, eligibility, minimum purchase, usage limits, and combination
-- rules -- stored as one flexible jsonb blob (`config`) rather than a
-- column per field, mirroring the client_segments.conditions pattern.
--
-- MANUAL STEP: this file must be pasted into the Supabase SQL Editor
-- and run once -- there is no CLI/connection string wired up in the
-- dev environment. src/lib/supabase/types.ts has been hand-updated to
-- match this shape in the same commit.
--
-- discount_codes.type/.value are NOT dropped (existing rows may be
-- referenced elsewhere and dropping a column is harder to undo than
-- just retiring it), but no code writes to them after this migration --
-- discount_type/config are now the single source of truth.
-- ============================================================

alter table discount_codes
  add column if not exists discount_type text
    check (discount_type in ('amount_off_products', 'buy_x_get_y', 'amount_off_order', 'free_shipping')),
  add column if not exists config jsonb not null default '{}'::jsonb;

-- Backfill every pre-existing row: all of them were implicitly a
-- storewide (never product/collection-scoped), unrestricted,
-- code-redeemed discount, so amount_off_order is the faithful mapping
-- (not amount_off_products, since none ever applied to specific items).
update discount_codes
set
  discount_type = 'amount_off_order',
  config = jsonb_build_object(
    'method', 'code',
    'code', code,
    'valueType', type,
    'value', value,
    'appliesTo', jsonb_build_object('scope', 'all'),
    'eligibility', jsonb_build_object('scope', 'all'),
    'minimumPurchase', jsonb_build_object('type', 'none'),
    'usageLimits', jsonb_build_object('onePerCustomer', false),
    'combinations', jsonb_build_object(
      'combinesWithProduct', false,
      'combinesWithOrder', false,
      'combinesWithShipping', false
    )
  )
where discount_type is null;

alter table discount_codes alter column discount_type set not null;
