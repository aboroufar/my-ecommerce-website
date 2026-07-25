-- ============================================================
-- Shopify-parity additions for the admin order detail page (top action
-- bar, order-source line, Timeline, Notes/Tags sidebar cards) --
-- mirrors the client detail page's own tags/notes precedent
-- (20260807000001_client_tags_and_notes.sql) applied to orders:
--
-- 1. orders.notes -- Shopify's order "Notes" card is a single freeform
--    field (not a list), edited in place. Distinct from order_notes
--    below, which is the running staff-comment log for the Timeline.
-- 2. orders.confirmation_email_sent_at -- set by the checkout webhook
--    and promoteDraftOrder at the moment the confirmation email is
--    actually sent, so the Timeline can show a real "Order confirmation
--    email was sent" event with a real timestamp.
-- 3. order_tags/order_tag_links -- dedicated tag pool for orders, same
--    reasoning as client_tags: each feature gets its own pool.
-- 4. order_notes -- backs the Timeline's staff-comment composer,
--    structurally identical to client_notes.
-- 5. Index on draft_orders.converted_order_id -- the order detail page
--    now does a reverse lookup (which draft order produced this order)
--    on every load; no such index existed before.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

alter table orders add column if not exists notes text;
alter table orders add column if not exists confirmation_email_sent_at timestamptz;

create table if not exists order_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists order_tag_links (
  order_id uuid not null references orders (id) on delete cascade,
  tag_id uuid not null references order_tags (id) on delete cascade,
  primary key (order_id, tag_id)
);

create index if not exists idx_order_tag_links_order on order_tag_links (order_id);
create index if not exists idx_order_tag_links_tag on order_tag_links (tag_id);

alter table order_tags enable row level security;
alter table order_tag_links enable row level security;

-- Admin-only, same as client_tags -- no public read policy, accessed
-- exclusively via the service-role admin client.

create table if not exists order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_notes_order on order_notes (order_id);

alter table order_notes enable row level security;

create index if not exists idx_draft_orders_converted_order_id on draft_orders (converted_order_id);
