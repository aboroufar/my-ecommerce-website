-- Whether the "Continue with Google" button shows on the customer sign-in
-- page (SignInForm.tsx). Doesn't touch Supabase's own Google OAuth
-- provider config (Supabase Dashboard -> Authentication -> Providers) --
-- this only controls whether the button is offered, same relationship as
-- payment_methods_enabled to Stripe's own payment method setup. Defaults
-- to true so this migration changes nothing for existing sites (Google
-- sign-in was previously shown unconditionally).
alter table site_settings
  add column if not exists google_signin_enabled boolean not null default true;
