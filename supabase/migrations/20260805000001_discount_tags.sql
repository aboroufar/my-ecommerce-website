-- ============================================================
-- Lets admins assign organizational tags to a discount (for filtering/
-- searching the Discounts list), mirroring product_tags. Distinct from
-- discount_codes.config's "Applies to" scoping, which controls which
-- products a discount's effect applies to -- this is purely a label on
-- the discount record itself, same tags table products already use.
--
-- MANUAL STEP: this file must be pasted into the Supabase SQL Editor
-- and run once -- there is no CLI/connection string wired up in the
-- dev environment. src/lib/supabase/types.ts has been hand-updated to
-- match this shape in the same commit.
-- ============================================================

create table if not exists discount_tags (
  discount_id uuid not null references discount_codes (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (discount_id, tag_id)
);

create index if not exists idx_discount_tags_discount on discount_tags (discount_id);
create index if not exists idx_discount_tags_tag on discount_tags (tag_id);

-- Admin-only, same as discount_codes itself -- no public read policy,
-- accessed exclusively via the service-role admin client.
alter table discount_tags enable row level security;
