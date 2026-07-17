alter table categories
  add column if not exists featured_in_grid boolean not null default false;
