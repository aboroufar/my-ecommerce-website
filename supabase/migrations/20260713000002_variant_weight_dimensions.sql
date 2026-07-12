-- Weight/dimensions differ per variant (e.g. Small vs Large has different
-- shipping weight), not per product -- move these from the product level
-- down to product_variants. The products.weight_text/dimensions_text
-- columns added in 20260713000001 are left in place (harmless if unused)
-- rather than dropped, since a product with zero variants still needs
-- somewhere to show this info.
alter table product_variants add column if not exists weight_text text;
alter table product_variants add column if not exists dimensions_text text;
