-- Two more top-level categories, each with a small set of subcategories
-- from a distinct product line, so the Categories mega-menu has a
-- realistic multi-category sample to drill into (in addition to the
-- existing Accessories / Apparel).
insert into categories (name, slug)
select 'Skincare', 'skincare'
where not exists (select 1 from categories where slug = 'skincare');

insert into categories (name, slug)
select 'Supplements', 'supplements'
where not exists (select 1 from categories where slug = 'supplements');

insert into categories (name, slug, parent_id)
select 'Face Care', 'face-care', id from categories where slug = 'skincare'
  and not exists (select 1 from categories where slug = 'face-care');
insert into categories (name, slug, parent_id)
select 'Body Care', 'body-care', id from categories where slug = 'skincare'
  and not exists (select 1 from categories where slug = 'body-care');
insert into categories (name, slug, parent_id)
select 'Sun Care', 'sun-care', id from categories where slug = 'skincare'
  and not exists (select 1 from categories where slug = 'sun-care');

insert into categories (name, slug, parent_id)
select 'Vitamins', 'vitamins', id from categories where slug = 'supplements'
  and not exists (select 1 from categories where slug = 'vitamins');
insert into categories (name, slug, parent_id)
select 'Protein', 'protein', id from categories where slug = 'supplements'
  and not exists (select 1 from categories where slug = 'protein');
insert into categories (name, slug, parent_id)
select 'Wellness', 'wellness', id from categories where slug = 'supplements'
  and not exists (select 1 from categories where slug = 'wellness');

-- Blog column: this app has no blog/article feature, so its items point
-- at real existing pages as placeholders rather than dead links.
insert into menu_columns (title, enabled, sort_order)
select 'Blog', true, 3
where not exists (select 1 from menu_columns where title = 'Blog');

insert into menu_items (column_id, label, href, sort_order)
select id, 'Latest news', '/faq', 0 from menu_columns where title = 'Blog'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/faq'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Get in touch', '/contact', 1 from menu_columns where title = 'Blog'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/contact'
  );

-- Home column: rename the original seeded "Home" item to "Main Home" (so
-- it reads clearly alongside the per-category items below), then add a
-- link to every top-level category, so Home mirrors the full category
-- list like the reference design.
update menu_items mi
set label = 'Main Home'
from menu_columns mc
where mi.column_id = mc.id and mc.title = 'Home' and mi.href = '/' and mi.label = 'Home';

insert into menu_items (column_id, label, href, sort_order)
select mc.id, c.name || ' Home', '/products?category=' || c.slug,
  row_number() over (order by c.name) + 1
from menu_columns mc
cross join categories c
where mc.title = 'Home'
  and c.parent_id is null
  and not exists (
    select 1 from menu_items
    where column_id = mc.id and href = '/products?category=' || c.slug
  );
