-- Admin activity log: records sign-ins to /admin, shown at
-- Admin -> Settings -> General -> "Store activity log". One row per
-- sign-in session (written from the auth callback route), not one row
-- per page view, so this stays a meaningful audit trail rather than
-- growing unbounded on every navigation.
create table if not exists admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null default 'accessed_shop',
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_at_idx
  on admin_activity_log (created_at desc);

alter table admin_activity_log enable row level security;

-- Written and read exclusively via the service-role client (same pattern
-- as the admins table itself) -- no anon/authenticated grants needed.

-- Store defaults + order ID formatting + legal business details, added to
-- the existing site_settings singleton rather than a new table, since
-- these are all single-value store-wide settings like the fields already
-- there.
alter table site_settings
  add column if not exists order_id_prefix text not null default '#',
  add column if not exists order_id_suffix text not null default '',
  add column if not exists store_currency text not null default 'EUR',
  add column if not exists store_timezone text not null default 'Europe/Rome',
  add column if not exists store_unit_system text not null default 'metric',
  add column if not exists store_weight_unit text not null default 'kg',
  add column if not exists business_type text not null default '',
  add column if not exists business_legal_name text not null default '',
  add column if not exists business_country text not null default '',
  add column if not exists business_address_line1 text not null default '',
  add column if not exists business_address_line2 text not null default '',
  add column if not exists business_city text not null default '',
  add column if not exists business_region text not null default '',
  add column if not exists business_postal_code text not null default '',
  add column if not exists business_phone text not null default '';
