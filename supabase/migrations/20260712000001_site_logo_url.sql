alter table site_settings
  add column if not exists site_logo_url text not null default '';
