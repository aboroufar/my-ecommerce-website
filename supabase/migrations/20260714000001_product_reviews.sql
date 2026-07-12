-- ============================================================
-- Product reviews
-- Public submissions go through admin moderation before appearing on the
-- storefront -- this is the first open/unauthenticated form in the
-- codebase that writes a DB row, so unlike other public-read tables there
-- is no anon/authenticated INSERT policy at all: the submission server
-- action writes via the service-role admin client with status='pending',
-- and only approved reviews are ever selectable by the public client.
-- ============================================================

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  reviewer_name text not null,
  reviewer_email text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_reviews_product on product_reviews (product_id);
create index if not exists idx_product_reviews_status on product_reviews (status);

alter table product_reviews enable row level security;

create policy "Public can view approved reviews"
  on product_reviews for select
  to anon, authenticated
  using (status = 'approved');
