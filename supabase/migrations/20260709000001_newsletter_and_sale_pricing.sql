-- ============================================================
-- Newsletter subscribers
-- Just an email capture list for now -- no marketing-send pipeline is
-- wired up yet (no Mailchimp/Resend-Broadcasts integration exists in
-- this codebase). Export or import this list manually into whatever
-- tool you pick later.
-- ============================================================

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- No policies for anon/authenticated at all -- same pattern as every
-- other write path in this app (products, categories, admins): writes
-- go through a server action using the service_role client, not
-- directly from the browser. An anon INSERT policy would let anyone
-- script-flood this table with junk rows with no rate limiting; routing
-- through the server action at least keeps it consistent with the rest
-- of the app's trust boundary even though it doesn't add real
-- rate-limiting on its own.

-- ============================================================
-- Sale pricing
-- Nullable: when set and greater than price_cents, the storefront shows
-- it as a struck-through "was" price with a % off badge. NULL or <=
-- price_cents means "not on sale" -- no separate boolean needed.
-- ============================================================

alter table products
  add column if not exists compare_at_price_cents integer
    check (compare_at_price_cents is null or compare_at_price_cents >= 0);
