-- Which of Stripe's built-in payment methods to offer at checkout, toggled
-- from /admin/settings/payments. "card" isn't stored here -- it's always
-- forced on in code (src/app/api/checkout/route.ts) regardless of this
-- column's contents, same as Shopify never lets you turn off card payments.
-- Defaults match this app's existing hardcoded payment_method_types array,
-- so this migration changes nothing for checkout until an admin edits it.
alter table site_settings
  add column if not exists payment_methods_enabled text[] not null default array['klarna', 'satispay', 'paypal'];
