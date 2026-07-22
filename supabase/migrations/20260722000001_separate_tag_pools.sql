-- ============================================================
-- Splits the single shared `tags` table (used for products, discounts,
-- AND blog posts) into three independent pools: `tags` (kept, now
-- product-only in practice), `discount_labels`, and `blog_tags`. Today
-- creating a tag from any one of the three admin surfaces (product form,
-- discount form, blog post form) inserts into the same global row and
-- makes it selectable from all three -- e.g. tagging a discount "Seasonal"
-- via DiscountTagChecklist also makes "Seasonal" show up as a product tag
-- and a blog tag. Each feature gets its own list going forward.
--
-- discount_codes.config's "Applies to" tag-scoping (which PRODUCTS a
-- discount applies to) intentionally keeps using the product `tags`
-- table unchanged -- it's selecting products, so it should stay wired to
-- what products are actually tagged with. Only `discount_tags` (the
-- organizational label join table on the discount record itself) moves
-- to the new `discount_labels`/`discount_label_links` pair.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

-- --- Discounts: new dedicated label pool -----------------------------

create table if not exists discount_labels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists discount_label_links (
  discount_id uuid not null references discount_codes (id) on delete cascade,
  label_id uuid not null references discount_labels (id) on delete cascade,
  primary key (discount_id, label_id)
);

create index if not exists idx_discount_label_links_discount on discount_label_links (discount_id);
create index if not exists idx_discount_label_links_label on discount_label_links (label_id);

alter table discount_labels enable row level security;
alter table discount_label_links enable row level security;

-- Backfill: carry over whatever was already assigned via the old shared
-- `tags` table / `discount_tags` join, matched by name so no assignment
-- is silently lost.
insert into discount_labels (name, slug)
select distinct t.name, t.slug
from discount_tags dt
join tags t on t.id = dt.tag_id
on conflict (name) do nothing;

insert into discount_label_links (discount_id, label_id)
select dt.discount_id, dl.id
from discount_tags dt
join tags t on t.id = dt.tag_id
join discount_labels dl on dl.name = t.name
on conflict do nothing;

drop table if exists discount_tags;

-- --- Blog: new dedicated tag pool -------------------------------------

create table if not exists blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists blog_post_tag_links (
  post_id uuid not null references blog_posts (id) on delete cascade,
  tag_id uuid not null references blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists idx_blog_post_tag_links_post on blog_post_tag_links (post_id);
create index if not exists idx_blog_post_tag_links_tag on blog_post_tag_links (tag_id);

alter table blog_tags enable row level security;
alter table blog_post_tag_links enable row level security;

-- Public read policy mirrors the old shared `tags` table's usage on
-- customer-facing blog pages/BlogSidebar.
create policy "Public can read blog tags" on blog_tags for select using (true);
create policy "Public can read blog post tag links" on blog_post_tag_links for select using (true);

insert into blog_tags (name, slug)
select distinct t.name, t.slug
from blog_post_tags bpt
join tags t on t.id = bpt.tag_id
on conflict (name) do nothing;

insert into blog_post_tag_links (post_id, tag_id)
select bpt.post_id, bt.id
from blog_post_tags bpt
join tags t on t.id = bpt.tag_id
join blog_tags bt on bt.name = t.name
on conflict do nothing;

drop table if exists blog_post_tags;
