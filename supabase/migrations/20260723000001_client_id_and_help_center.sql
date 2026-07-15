-- ============================================================
-- Unique customer-facing client ID
-- ============================================================

alter table customers add column if not exists client_id text;

create or replace function generate_client_id()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no O/0/I/1 (ambiguous)
  result text := 'C-';
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

update customers set client_id = generate_client_id() where client_id is null;

alter table customers alter column client_id set not null;
create unique index if not exists idx_customers_client_id on customers (client_id);

-- Assign a client_id on every new signup too
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.customers (id, email, client_id)
  values (new.id, new.email, generate_client_id());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- Help Center: categories + topics
-- ============================================================

create table if not exists help_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'card',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists help_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references help_categories (id) on delete cascade,
  title text not null,
  body_html text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_help_topics_category on help_topics (category_id);

alter table help_categories enable row level security;
alter table help_topics enable row level security;

create policy "Public can view help categories"
  on help_categories for select
  to anon, authenticated
  using (true);

create policy "Public can view help topics"
  on help_topics for select
  to anon, authenticated
  using (true);

alter table site_settings add column if not exists help_page_enabled boolean not null default true;
