-- ============================================================
-- Two additions for the redesigned admin client detail page (Shopify-
-- style layout: stat cards, activity timeline, tags sidebar):
--
-- 1. client_tags/client_tag_links -- a dedicated tag pool for clients,
--    same reasoning as discount_labels/blog_tags (see
--    20260722000001_separate_tag_pools.sql): each feature gets its own
--    pool so tagging a client "VIP" doesn't also make "VIP" selectable
--    as a product tag.
--
-- 2. client_notes -- backs the "Timeline" panel (admin-authored notes +
--    a system-generated "created" entry computed from clients.created_at
--    at read time, not stored). No such activity-log table existed
--    anywhere in this codebase before now.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

create table if not exists client_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists client_tag_links (
  client_id uuid not null references clients (id) on delete cascade,
  tag_id uuid not null references client_tags (id) on delete cascade,
  primary key (client_id, tag_id)
);

create index if not exists idx_client_tag_links_client on client_tag_links (client_id);
create index if not exists idx_client_tag_links_tag on client_tag_links (tag_id);

alter table client_tags enable row level security;
alter table client_tag_links enable row level security;

-- Admin-only, same as client_segments -- no public read policy, accessed
-- exclusively via the service-role admin client.

create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_notes_client on client_notes (client_id);

alter table client_notes enable row level security;
