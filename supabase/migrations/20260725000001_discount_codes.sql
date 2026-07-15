create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  value integer not null check (value > 0), -- percent: 1-100, fixed: cents
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table orders add column if not exists discount_code text;
alter table orders add column if not exists discount_cents integer not null default 0;
