-- Per-post author fields -- replaces the single site-wide blog author
-- (site_settings.blog_author_*) so different posts can credit different
-- writers. The old site_settings columns are left in place, unused.
alter table blog_posts
  add column if not exists author_name text not null default '',
  add column if not exists author_photo_url text not null default '',
  add column if not exists author_bio text not null default '',
  add column if not exists author_facebook_url text not null default '',
  add column if not exists author_twitter_url text not null default '',
  add column if not exists author_linkedin_url text not null default '';
