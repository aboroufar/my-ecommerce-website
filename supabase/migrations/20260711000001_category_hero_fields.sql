-- Optional per-category "landing page" hero content: shown at the top of
-- /products?category=X when a top-level category is selected, matching
-- the reference design's two-large-photo + featured-subcategory-cards
-- header. All nullable/optional -- categories without a hero_image_url
-- render the page without the hero section, so this never breaks
-- existing categories.
alter table categories
  add column if not exists hero_image_url text,
  add column if not exists hero_headline text,
  add column if not exists hero_eyebrow text default 'Everything you may need';
