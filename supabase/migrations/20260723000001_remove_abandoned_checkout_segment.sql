-- ============================================================
-- Removes the seeded "Abandoned checkouts in the last 30 days" segment
-- and the 'abandoned_checkout' condition_type entirely. This segment
-- always matched 0 clients -- this store's cart is client-side
-- localStorage only, with no server-side abandoned-checkout tracking to
-- evaluate against (see the original comment in
-- 20260801000001_customer_segments.sql). Keeping a segment type that can
-- never match anyone in the list is confusing rather than useful, so
-- it's removed rather than left as a permanent placeholder.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once.
-- ============================================================

delete from client_segments where condition_type = 'abandoned_checkout';

alter table client_segments drop constraint if exists customer_segments_condition_type_check;
alter table client_segments add constraint client_segments_condition_type_check
  check (condition_type in ('conditions'));
