-- Sample data for local development / first deploy smoke-testing.
-- Run this AFTER the migrations, only in a dev/staging project
-- (not meant for production data).

insert into categories (name, slug) values
  ('Apparel', 'apparel'),
  ('Accessories', 'accessories')
on conflict (slug) do nothing;

insert into products (name, slug, description, price_cents, sku, stock_qty, status)
values
  ('Classic Tee', 'classic-tee', 'A soft, everyday cotton t-shirt.', 2500, 'TEE-001', 100, 'active'),
  ('Canvas Tote', 'canvas-tote', 'Durable canvas tote bag for everyday carry.', 1800, 'BAG-001', 50, 'active'),
  ('Wool Beanie', 'wool-beanie', 'Warm knit beanie, one size fits most.', 2200, 'HAT-001', 75, 'active')
on conflict (slug) do nothing;

insert into product_categories (product_id, category_id)
select p.id, c.id from products p, categories c
where (p.slug = 'classic-tee' and c.slug = 'apparel')
   or (p.slug = 'wool-beanie' and c.slug = 'apparel')
   or (p.slug = 'canvas-tote' and c.slug = 'accessories')
on conflict do nothing;
