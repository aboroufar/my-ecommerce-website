-- ============================================================
-- Admin users table
-- Replaces the ADMIN_EMAILS env var as the primary source of truth for
-- /admin access. The env var stays as a fallback in application code
-- (src/lib/auth.ts) so a store owner can't lock themselves out if this
-- table is ever empty (e.g. right after this migration runs, before
-- anyone has been added).
-- ============================================================

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- No policies for anon/authenticated on purpose: this table is only ever
-- read/written via the service_role client (src/lib/supabase/admin.ts),
-- same pattern as products/categories writes. RLS enabled with no grants
-- means anon/authenticated get zero access by default.

-- ============================================================
-- Storage bucket for product images
-- The 'product-images' bucket itself is created via the Storage
-- management API (not raw SQL against storage.buckets -- that table's
-- shape isn't guaranteed stable across Supabase platform versions the
-- way the documented REST API is). This migration only adds the public
-- read policy on storage.objects, which is the stable, documented way
-- to grant bucket access.
-- ============================================================

create policy "Public can view product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- No insert/update/delete policies for anon/authenticated on purpose --
-- uploads go through the admin product form's server action, which uses
-- the service_role client and bypasses these policies entirely.
