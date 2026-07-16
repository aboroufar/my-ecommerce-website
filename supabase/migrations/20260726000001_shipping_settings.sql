alter table site_settings add column if not exists shipping_flat_rate_cents integer not null default 590;
alter table site_settings add column if not exists free_shipping_threshold_cents integer not null default 7500;
alter table orders add column if not exists shipping_cents integer not null default 0;
