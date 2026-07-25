-- ============================================================
-- Refunds -- header + line-item tables mirroring Shopify's own
-- Refund/RefundLineItem shape (verified directly against a connected
-- Shopify store's GraphQL schema: Refund -> refundLineItems +
-- transactions). One row per Stripe Refund API call (partial or full),
-- with a per-order-item breakdown so partial/per-line refunds and
-- their restock decisions are fully auditable, not just a single
-- "refunded: true" flag.
--
-- created_by_email is a plain nullable text column, not a FK to
-- admins(id): getAdminUser()/isAdminEmail() (src/lib/auth.ts) falls
-- back to an ADMIN_EMAILS env var when the admins table is empty, so a
-- valid acting admin may have no admins row at all. No other table in
-- this codebase FK-references admins for the same reason.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  reason text,
  stripe_refund_id text unique,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_refunds_order on refunds (order_id);

create table if not exists refund_line_items (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null references refunds (id) on delete cascade,
  order_item_id uuid not null references order_items (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  amount_cents integer not null check (amount_cents >= 0),
  restocked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_refund_line_items_refund on refund_line_items (refund_id);
create index if not exists idx_refund_line_items_order_item on refund_line_items (order_item_id);

-- Admin-only, same pattern as purchase_orders/suppliers -- no public
-- read policy, accessed exclusively via the service-role admin client.
alter table refunds enable row level security;
alter table refund_line_items enable row level security;
