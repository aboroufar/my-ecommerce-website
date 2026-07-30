-- Role-based access for admins: each admin is assigned exactly one of a
-- fixed set of roles (enforced in application code, see
-- src/lib/permissions.ts, not as a Postgres check constraint, so the role
-- list can evolve without a migration). Existing admins default to
-- 'admin' (full access) so this migration never locks anyone out.
alter table admins
  add column if not exists role text not null default 'admin';
