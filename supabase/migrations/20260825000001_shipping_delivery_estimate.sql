-- Estimated delivery date settings for /admin/settings/shipping's "Manual"
-- mode (fulfillment time in days + a transit day range). Storefront
-- computes today + fulfillment_days + [transit_min, transit_max] business
-- days client-side -- no live Shippo rate lookup, since there's no
-- shipping address to quote against until checkout starts.
-- delivery_estimate_enabled defaults to false, so this migration adds no
-- new customer-facing UI until an admin explicitly turns it on.
alter table site_settings
  add column if not exists delivery_estimate_enabled boolean not null default false;
alter table site_settings
  add column if not exists fulfillment_time_days smallint not null default 1;
alter table site_settings
  add column if not exists transit_time_min_days smallint not null default 3;
alter table site_settings
  add column if not exists transit_time_max_days smallint not null default 5;
