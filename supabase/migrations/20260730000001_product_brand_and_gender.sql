-- ============================================================
-- Product filtering: brand + gender
-- ============================================================
-- brand_id links a product to the existing brands table (previously used
-- only for the decorative homepage brand-logo bar). Loose reference, not
-- ownership -- on delete set null, matching "removing a brand shouldn't
-- delete products," unlike the cascade deletes used for genuine
-- parent/child rows like product_images.product_id.

alter table products
  add column if not exists brand_id uuid references brands (id) on delete set null;

-- gender models a merchandising category on the product itself, distinct
-- from customers.gender (which models a person's identity and needs
-- 'other'/'prefer_not_to_say'). Retail convention: binary + unisex.
alter table products
  add column if not exists gender text
  check (gender is null or gender in ('women', 'men', 'unisex'));

create index if not exists idx_products_brand_id on products (brand_id);
create index if not exists idx_products_gender on products (gender);

-- No RLS changes needed: the existing "Public can view active products"
-- policy is row-level, not column-level, so these new columns are already
-- exposed to anon/authenticated for any row that policy already allows.
