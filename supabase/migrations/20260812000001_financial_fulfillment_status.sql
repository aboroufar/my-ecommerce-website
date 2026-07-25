-- ============================================================
-- Split orders.status into independent financial_status and
-- fulfillment_status tracks, mirroring Shopify's own order model (an
-- order can be paid+unfulfilled, paid+partially_fulfilled, etc. --
-- these are orthogonal, not one linear state machine). Verified
-- against a real connected Shopify store's own displayFinancialStatus/
-- displayFulfillmentStatus fields before designing this -- an order
-- there was REFUNDED + FULFILLED simultaneously, confirming the two
-- tracks really are independent.
--
-- Both enums are deliberately trimmed to only the states this app's
-- own checkout/webhook/refund/fulfillment code can actually produce
-- (no manual payment capture, no POS, no scheduled/on-hold
-- fulfillment) rather than matching Shopify's full enum
-- (AUTHORIZED/PARTIALLY_PAID/EXPIRED/ON_HOLD/SCHEDULED/etc.).
--
-- orders.status is NOT dropped -- same "deprecate, don't drop"
-- precedent as discount_codes.type/.value in
-- 20260803000001_discount_types_and_config.sql -- but no code writes
-- to it after this migration ships; financial_status/fulfillment_status
-- are the single source of truth from here on.
--
-- The real checkout route (src/app/api/checkout/route.ts) still creates
-- an `orders` row BEFORE Stripe confirms payment (status: "pending"),
-- exactly as before this migration -- that pre-payment insert is
-- untouched, unrelated existing behavior this migration does not
-- change. financial_status therefore keeps a 'pending' value to match:
-- draft orders (an admin-initiated, pre-payment flow -- see
-- 20260814000001_draft_orders.sql) are the ones that never touch this
-- table until paid; a real storefront checkout still goes
-- pending -> paid/voided here, same as it always has.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

alter table orders
  add column if not exists financial_status text
    check (financial_status in (
      'pending', 'paid', 'partially_refunded', 'refunded', 'voided'
    )),
  add column if not exists fulfillment_status text
    check (fulfillment_status in (
      'unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled'
    ));

-- Backfill every pre-existing row from the old single `status`.
-- cancelled -> voided/cancelled is safe because the webhook only ever
-- cancels an order while it's still status = "pending" (see the
-- .eq("status","pending") guard in both
-- checkout.session.async_payment_failed/.expired handlers in
-- src/app/api/webhooks/stripe/route.ts), so every historical
-- 'cancelled' row is guaranteed to have never been charged. A leftover
-- 'pending' row (still genuinely awaiting payment resolution) maps
-- straight across to financial_status 'pending'.
update orders set
  financial_status = case status
    when 'pending'   then 'pending'
    when 'paid'      then 'paid'
    when 'fulfilled' then 'paid'
    when 'cancelled' then 'voided'
    when 'refunded'  then 'refunded'
    else 'voided'
  end,
  fulfillment_status = case status
    when 'pending'   then 'unfulfilled'
    when 'paid'      then 'unfulfilled'
    when 'fulfilled' then 'fulfilled'
    when 'cancelled' then 'cancelled'
    when 'refunded'  then 'unfulfilled'
    else 'cancelled'
  end
where financial_status is null;

alter table orders
  alter column financial_status set not null,
  alter column financial_status set default 'pending',
  alter column fulfillment_status set not null,
  alter column fulfillment_status set default 'unfulfilled';

create index if not exists idx_orders_financial_status on orders (financial_status);
create index if not exists idx_orders_fulfillment_status on orders (fulfillment_status);
