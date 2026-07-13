create table if not exists blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  cover_image_url text,
  body_html text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists blog_post_categories (
  post_id uuid not null references blog_posts (id) on delete cascade,
  category_id uuid not null references blog_categories (id) on delete cascade,
  primary key (post_id, category_id)
);

create table if not exists blog_post_tags (
  post_id uuid not null references blog_posts (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists idx_blog_posts_status_published on blog_posts (status, published_at desc);
create index if not exists idx_blog_post_categories_post on blog_post_categories (post_id);
create index if not exists idx_blog_post_categories_category on blog_post_categories (category_id);
create index if not exists idx_blog_post_tags_post on blog_post_tags (post_id);
create index if not exists idx_blog_post_tags_tag on blog_post_tags (tag_id);

alter table blog_categories enable row level security;
alter table blog_posts enable row level security;
alter table blog_post_categories enable row level security;
alter table blog_post_tags enable row level security;

create policy "Public can view blog categories"
  on blog_categories for select
  to anon, authenticated
  using (true);

create policy "Public can view published posts"
  on blog_posts for select
  to anon, authenticated
  using (status = 'published');

create policy "Public can view blog post categories"
  on blog_post_categories for select
  to anon, authenticated
  using (true);

create policy "Public can view blog post tags"
  on blog_post_tags for select
  to anon, authenticated
  using (true);

-- Single site-wide author profile shown on every post -- simplest model
-- for a single-brand storefront blog, matches how site_settings already
-- holds one singleton row for site-wide config.
alter table site_settings
  add column if not exists blog_author_name text not null default '',
  add column if not exists blog_author_photo_url text not null default '',
  add column if not exists blog_author_bio text not null default '',
  add column if not exists blog_author_facebook_url text not null default '',
  add column if not exists blog_author_twitter_url text not null default '',
  add column if not exists blog_author_linkedin_url text not null default '';
