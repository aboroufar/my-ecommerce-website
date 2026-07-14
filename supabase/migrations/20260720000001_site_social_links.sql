-- Site-wide social links, shown in the blog sidebar's "Follow Us" row and
-- available for reuse elsewhere (footer, etc.) later.
alter table site_settings
  add column if not exists social_facebook_url text not null default '',
  add column if not exists social_twitter_url text not null default '',
  add column if not exists social_linkedin_url text not null default '',
  add column if not exists social_instagram_url text not null default '';
