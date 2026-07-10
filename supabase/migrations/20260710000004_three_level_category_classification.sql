-- Extends the sample Skincare / Supplements groups (added in
-- 20260710000003) with a third level: specific product-line items
-- underneath each group, so the Categories mega-menu can show a true
-- Category -> Group -> Item drill-down (e.g. Skincare -> Face Care ->
-- Matte Foundation), matching the reference design.
insert into categories (name, slug, parent_id)
select 'Matte Foundation', 'matte-foundation', id from categories where slug = 'face-care'
  and not exists (select 1 from categories where slug = 'matte-foundation');
insert into categories (name, slug, parent_id)
select 'Natural Face Tonic', 'natural-face-tonic', id from categories where slug = 'face-care'
  and not exists (select 1 from categories where slug = 'natural-face-tonic');
insert into categories (name, slug, parent_id)
select 'Face Powder', 'face-powder', id from categories where slug = 'face-care'
  and not exists (select 1 from categories where slug = 'face-powder');

insert into categories (name, slug, parent_id)
select 'Body Lotion', 'body-lotion', id from categories where slug = 'body-care'
  and not exists (select 1 from categories where slug = 'body-lotion');
insert into categories (name, slug, parent_id)
select 'Argan Oil', 'argan-oil', id from categories where slug = 'body-care'
  and not exists (select 1 from categories where slug = 'argan-oil');

insert into categories (name, slug, parent_id)
select 'SPF 50 Sunscreen', 'spf-50-sunscreen', id from categories where slug = 'sun-care'
  and not exists (select 1 from categories where slug = 'spf-50-sunscreen');
insert into categories (name, slug, parent_id)
select 'After Sun Gel', 'after-sun-gel', id from categories where slug = 'sun-care'
  and not exists (select 1 from categories where slug = 'after-sun-gel');

insert into categories (name, slug, parent_id)
select 'Vitamin D3 Drops', 'vitamin-d3-drops', id from categories where slug = 'vitamins'
  and not exists (select 1 from categories where slug = 'vitamin-d3-drops');
insert into categories (name, slug, parent_id)
select 'Vitamin C Drops', 'vitamin-c-drops', id from categories where slug = 'vitamins'
  and not exists (select 1 from categories where slug = 'vitamin-c-drops');
insert into categories (name, slug, parent_id)
select 'Vitamin D3 Pills', 'vitamin-d3-pills', id from categories where slug = 'vitamins'
  and not exists (select 1 from categories where slug = 'vitamin-d3-pills');

insert into categories (name, slug, parent_id)
select 'Whey Protein', 'whey-protein', id from categories where slug = 'protein'
  and not exists (select 1 from categories where slug = 'whey-protein');
insert into categories (name, slug, parent_id)
select 'Plant Protein', 'plant-protein', id from categories where slug = 'protein'
  and not exists (select 1 from categories where slug = 'plant-protein');

insert into categories (name, slug, parent_id)
select 'Sleep Gummies', 'sleep-gummies', id from categories where slug = 'wellness'
  and not exists (select 1 from categories where slug = 'sleep-gummies');
insert into categories (name, slug, parent_id)
select 'Stress Relief', 'stress-relief', id from categories where slug = 'wellness'
  and not exists (select 1 from categories where slug = 'stress-relief');
