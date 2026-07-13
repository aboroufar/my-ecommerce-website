alter table categories
  add column if not exists display_only boolean not null default false;
