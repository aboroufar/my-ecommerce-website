alter table customers add column if not exists date_of_birth date;
alter table customers add column if not exists gender text
  check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say'));

alter table addresses add column if not exists is_billing boolean not null default false;
