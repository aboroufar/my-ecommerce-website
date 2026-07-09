-- ============================================================
-- Editable site content
-- Self-service copy editing for storefront sections (hero, closing CTA,
-- footer About text, etc.) without a code deploy. Key/value rather than
-- one column per field so new editable fields can be added later without
-- a migration -- the admin UI and getSiteContent() are the only places
-- that need to know about a new key.
--
-- The `key` naming convention is "section.field" (e.g. "hero.headline")
-- so this can grow into first-class "sections" (with an order column)
-- later for drag-and-drop rearranging without changing the storage shape.
-- ============================================================

create table if not exists site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- No anon/authenticated policies -- same pattern as every other write
-- path in this app. Writes go through a server action using the
-- service_role client (requireAdmin() checked in the action itself).

insert into site_content (key, value) values
  ('hero.headline', 'Considered goods, elevated.'),
  ('hero.subheadline', 'Made with restraint. Built to last.'),
  ('hero.cta_primary_label', 'Shop all'),
  ('hero.cta_secondary_label', 'Find your routine'),
  ('closing.headline', 'Your routine, simplified.'),
  ('closing.subheadline', 'Three steps. Real results.'),
  ('closing.cta_label', 'Build your routine'),
  ('footer.about_text', 'Small-batch essentials, formulated with restraint and made to be used — not just displayed.')
on conflict (key) do nothing;
