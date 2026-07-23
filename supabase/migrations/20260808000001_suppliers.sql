-- ============================================================
-- Suppliers -- first piece of inventory management. A supplier is a
-- vendor a product can be purchased from; this migration is scoped to
-- the supplier record itself (company/contact/address/payment terms)
-- only -- no purchase orders or product-supplier linkage yet, those are
-- separate future features.
--
-- payment_terms and currency are stored as free text rather than
-- Postgres enums -- same reasoning as discount_codes.discount_type
-- using a check constraint instead of an enum type: easier to extend
-- later without an enum-alter migration. currency defaults to 'eur' and
-- has no admin-facing picker yet, matching every other currency column
-- in this app (orders.currency, products.currency) -- this store is
-- single-currency in practice even though the field exists.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
-- src/lib/supabase/types.ts has been hand-updated to match in the same
-- commit.
-- ============================================================

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  country text not null default 'Italy',
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  province text,
  contact_name text,
  phone text,
  email text,
  website text,
  notes text,
  payment_terms text not null default 'none'
    check (payment_terms in ('none', 'cod', 'receipt', 'advance', 'net7', 'net15', 'net30', 'net45', 'net60')),
  currency text not null default 'eur',
  created_at timestamptz not null default now()
);

create index if not exists idx_suppliers_company on suppliers (company);

-- Admin-only, same as discount_codes/client_segments -- no public read
-- policy, accessed exclusively via the service-role admin client.
alter table suppliers enable row level security;
