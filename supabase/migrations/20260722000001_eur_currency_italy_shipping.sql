-- Switch storefront currency to EUR. Existing rows are relabeled (not
-- converted at a real exchange rate) since this is pre-launch demo data --
-- price_cents values are unchanged, only the currency code changes.
alter table products alter column currency set default 'eur';
alter table orders alter column currency set default 'eur';

update products set currency = 'eur' where currency = 'usd';
update orders set currency = 'eur' where currency = 'usd';
