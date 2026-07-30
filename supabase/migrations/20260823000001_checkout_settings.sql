-- Checkout customization, read by the checkout route to build the Stripe
-- Checkout Session (phone/billing collection, custom fields, T&C consent).
-- jsonb (not one column per field) since this shape will keep growing --
-- same pattern as discount_codes.config. Default '{}' means "use Stripe's
-- own defaults for everything", so this migration changes no behavior
-- until an admin edits it from /admin/settings/checkout.
alter table site_settings
  add column if not exists checkout_settings jsonb not null default '{}'::jsonb;
