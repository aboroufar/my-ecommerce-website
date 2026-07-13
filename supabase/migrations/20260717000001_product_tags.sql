create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists product_tags (
  product_id uuid not null references products (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create index if not exists idx_product_tags_product on product_tags (product_id);
create index if not exists idx_product_tags_tag on product_tags (tag_id);

alter table tags enable row level security;
alter table product_tags enable row level security;

create policy "Public can view tags"
  on tags for select
  to anon, authenticated
  using (true);

create policy "Public can view product_tags"
  on product_tags for select
  to anon, authenticated
  using (true);
