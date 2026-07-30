-- Payment capture method setting, read by the checkout route (sets the
-- Stripe PaymentIntent's capture_method) and by order fulfillment (captures
-- a manually-authorized PaymentIntent once the order ships). 'automatic'
-- matches this app's existing checkout behavior, so this migration changes
-- nothing for stores that never touch the new setting.
alter table site_settings
  add column if not exists payment_capture_method text not null default 'automatic';
