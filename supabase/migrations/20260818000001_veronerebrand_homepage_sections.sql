-- New homepage sections for the Veroné-inspired rebrand: a promo
-- banner, an editorial "journal" block reusing existing blog posts,
-- and a dark newsletter+photo block. Re-sequences sort_order for
-- best_sellers/brand_bar to make room after 'sale' (2).
insert into homepage_sections (key, label, enabled, sort_order) values
  ('promo_banner', 'Promo banner', true, 3),
  ('journal', 'Journal / editorial posts', true, 5),
  ('newsletter_photo', 'Newsletter signup (photo)', true, 6)
on conflict (key) do nothing;

update homepage_sections set sort_order = 4 where key = 'best_sellers';
update homepage_sections set sort_order = 7 where key = 'brand_bar';
