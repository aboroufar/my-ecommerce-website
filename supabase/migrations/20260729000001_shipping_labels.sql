alter table orders add column if not exists carrier text;
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists tracking_url text;
alter table orders add column if not exists label_url text;
alter table orders add column if not exists shippo_transaction_id text;
alter table orders add column if not exists pending_rates jsonb;

alter table site_settings add column if not exists ship_from_name text;
alter table site_settings add column if not exists ship_from_line1 text;
alter table site_settings add column if not exists ship_from_line2 text;
alter table site_settings add column if not exists ship_from_city text;
alter table site_settings add column if not exists ship_from_region text;
alter table site_settings add column if not exists ship_from_postal_code text;
alter table site_settings add column if not exists ship_from_country text;
alter table site_settings add column if not exists ship_from_phone text;
alter table site_settings add column if not exists ship_from_email text;
