-- ============================================================
-- Draft orders / admin invoicing -- a genuinely separate resource from
-- orders, matching how a connected Shopify store's own DraftOrder
-- GraphQL object works (verified directly against its schema: its own
-- status enum OPEN/INVOICE_SENT/COMPLETED, own invoiceUrl/
-- invoiceSentAt, its own line items, only becoming a real Order via
-- draftOrder.order once paid). An earlier version of this plan reused
-- the orders table with an is_draft flag; this was changed to match
-- Shopify's real model instead, after inspecting it directly.
--
-- draft_order_items mirrors order_items' shape exactly (product_name/
-- variant_label snapshots, nullable product_id/variant_id for a live
-- link when available) since a draft order item becomes a real order
-- item verbatim at "promotion" time (see src/lib/orderStock.ts's
-- promoteDraftOrder, called either by an admin marking a draft paid in
-- cash, or by the Stripe webhook when a sent Payment Link is paid).
--
-- guest_name/guest_email exist because a draft order needs a customer
-- identity before any Stripe payment exists to supply one (unlike
-- src/app/api/checkout/route.ts, which always gets an email from
-- Stripe's own session by the time the webhook runs).
--
-- converted_order_id is set at promotion time and mirrors Shopify's own
-- draftOrder.order back-reference -- lets the admin UI link from a
-- completed draft to the real order it became.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

create table if not exists draft_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients (id) on delete set null,
  guest_name text,
  guest_email text,
  status text not null default 'open'
    check (status in ('open', 'invoice_sent', 'completed')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'eur',
  stripe_payment_link_id text unique,
  stripe_payment_link_url text,
  invoice_sent_at timestamptz,
  converted_order_id uuid references orders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_draft_orders_client on draft_orders (client_id);
create index if not exists idx_draft_orders_status on draft_orders (status);

drop trigger if exists trg_draft_orders_updated_at on draft_orders;
create trigger trg_draft_orders_updated_at
  before update on draft_orders
  for each row
  execute function set_updated_at();

create table if not exists draft_order_items (
  id uuid primary key default gen_random_uuid(),
  draft_order_id uuid not null references draft_orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  variant_id uuid references product_variants (id) on delete set null,
  variant_label text
);

create index if not exists idx_draft_order_items_draft_order on draft_order_items (draft_order_id);

-- Admin-only, same pattern as purchase_orders -- no public read policy,
-- accessed exclusively via the service-role admin client.
alter table draft_orders enable row level security;
alter table draft_order_items enable row level security;
