alter table customers
  add column if not exists phone text,
  add column if not exists stripe_customer_id text;

create unique index if not exists idx_customers_stripe_customer_id
  on customers (stripe_customer_id) where stripe_customer_id is not null;
