alter table site_settings
  add column if not exists reviews_enabled boolean not null default true;
