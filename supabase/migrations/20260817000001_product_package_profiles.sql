-- Products/variants now assign a reusable package_profiles row instead of
-- freeform weight_text/dimensions_text -- gives shipping-label weight
-- calculation structured data to work with instead of unparseable text.
-- item_weight_grams is distinct from empty_weight_grams: the latter stays
-- "this box's own tare weight" for the shipping-label page's box picker,
-- the former is "how much one unit of this product weighs".
alter table package_profiles add column if not exists item_weight_grams numeric;

alter table product_variants add column if not exists package_profile_id uuid
  references package_profiles(id) on delete set null;
create index if not exists idx_product_variants_package_profile_id
  on product_variants (package_profile_id);

alter table products drop column if exists weight_text;
alter table products drop column if exists dimensions_text;
alter table product_variants drop column if exists weight_text;
alter table product_variants drop column if exists dimensions_text;
