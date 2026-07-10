-- Subcategory support: a category can optionally belong to a parent
-- category. on delete set null so deleting a parent demotes its children
-- to top-level rather than cascading deletes through the tree.
alter table categories
  add column if not exists parent_id uuid references categories(id) on delete set null;

create index if not exists categories_parent_id_idx on categories (parent_id);

-- Lets the admin rename or hide the auto-generated "Categories" mega-menu
-- column label instead of it being hardcoded in the header components.
alter table site_settings
  add column if not exists categories_menu_label text not null default 'Categories';

-- Seed real "Home" / "Shop" / "Pages" menu columns (each linking to pages
-- that actually exist in this app) so the header menu has more than just
-- the auto-generated Categories column out of the box. Only run once --
-- guarded on absence of a column with the same title, since menu_columns
-- has no unique constraint on title and this migration must stay
-- re-runnable without duplicating rows.
insert into menu_columns (title, enabled, sort_order)
select 'Home', true, 0
where not exists (select 1 from menu_columns where title = 'Home');

insert into menu_columns (title, enabled, sort_order)
select 'Shop', true, 1
where not exists (select 1 from menu_columns where title = 'Shop');

insert into menu_columns (title, enabled, sort_order)
select 'Pages', true, 2
where not exists (select 1 from menu_columns where title = 'Pages');

insert into menu_items (column_id, label, href, sort_order)
select id, 'Home', '/', 0 from menu_columns where title = 'Home'
  and not exists (select 1 from menu_items where column_id = menu_columns.id);

insert into menu_items (column_id, label, href, sort_order)
select id, 'Shop all', '/products', 0 from menu_columns where title = 'Shop'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/products'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Cart', '/cart', 1 from menu_columns where title = 'Shop'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/cart'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Checkout', '/checkout', 2 from menu_columns where title = 'Shop'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/checkout'
  );

insert into menu_items (column_id, label, href, sort_order)
select id, 'Contact us', '/contact', 0 from menu_columns where title = 'Pages'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/contact'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'FAQ', '/faq', 1 from menu_columns where title = 'Pages'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/faq'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Shipping', '/shipping', 2 from menu_columns where title = 'Pages'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/shipping'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Returns', '/returns', 3 from menu_columns where title = 'Pages'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/returns'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Privacy policy', '/privacy', 4 from menu_columns where title = 'Pages'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/privacy'
  );
insert into menu_items (column_id, label, href, sort_order)
select id, 'Terms of service', '/terms', 5 from menu_columns where title = 'Pages'
  and not exists (
    select 1 from menu_items where column_id = menu_columns.id and href = '/terms'
  );
