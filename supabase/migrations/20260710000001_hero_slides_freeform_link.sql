-- ============================================================
-- Hero slides: freeform link instead of category tie-in
-- Slides no longer show a category label or link only to a category
-- page -- "Read more" is now any URL the admin sets, ready for future
-- targets like blog posts. Drops the category requirement entirely
-- since it no longer drives anything on the slide.
-- ============================================================

alter table hero_slides add column if not exists link_url text not null default '/products';
alter table hero_slides alter column category_id drop not null;

-- Also remove the product_marquee homepage section -- replaced by the
-- brand bar, which now serves the same "browse more" role.
delete from homepage_sections where key = 'product_marquee';
