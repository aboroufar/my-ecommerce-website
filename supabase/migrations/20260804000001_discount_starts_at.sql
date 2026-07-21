-- ============================================================
-- Adds a start date/time to discounts, alongside the existing
-- expires_at (end date/time), so admins can schedule a discount to
-- become active in the future rather than only ever "active now".
--
-- MANUAL STEP: this file must be pasted into the Supabase SQL Editor
-- and run once -- there is no CLI/connection string wired up in the
-- dev environment. src/lib/supabase/types.ts has been hand-updated to
-- match this shape in the same commit.
-- ============================================================

alter table discount_codes
  add column if not exists starts_at timestamptz;

-- Backfill: every pre-existing discount was effectively active from
-- the moment it was created.
update discount_codes set starts_at = created_at where starts_at is null;

alter table discount_codes alter column starts_at set not null;
alter table discount_codes alter column starts_at set default now();
