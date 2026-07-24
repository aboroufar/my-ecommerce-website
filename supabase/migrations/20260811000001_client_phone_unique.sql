-- ============================================================
-- Prevents two different clients from sharing the same phone number.
-- A plain `unique` constraint (not a partial/filtered index) is enough
-- here -- Postgres treats every NULL as distinct from other NULLs by
-- default, so clients with no phone on file don't collide with each
-- other, only genuine duplicate non-null numbers are rejected.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once -- no
-- CLI/connection string is wired up in this dev environment.
--
-- If this fails with a duplicate-key error, it means two existing
-- clients already share a phone number -- find them first with:
--   select phone, array_agg(id) from clients
--   where phone is not null group by phone having count(*) > 1;
-- and resolve the conflict (clear one, or confirm they're actually the
-- same person) before re-running this migration.
-- ============================================================

alter table clients
  add constraint clients_phone_unique unique (phone);
