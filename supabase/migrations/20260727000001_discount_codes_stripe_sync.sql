-- Discount codes are redeemed directly on Stripe's hosted Checkout page
-- (allow_promotion_codes) instead of being applied on our own cart page,
-- so each row needs a matching Stripe Coupon + Promotion Code. These ids
-- are nullable because they're populated by the app right after insert/
-- update, not atomically with it (a Stripe API call can't happen inside
-- the same transaction as the Postgres insert).
alter table discount_codes
  add column stripe_coupon_id text,
  add column stripe_promotion_code_id text;
