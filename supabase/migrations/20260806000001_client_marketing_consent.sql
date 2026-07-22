-- ============================================================
-- Adds SMS and WhatsApp marketing consent flags to clients, needed for
-- the admin "Add client" form. Email marketing consent already has a
-- home (newsletter_subscribers, matched by email) -- these two piggyback
-- directly on the client row instead since there's no equivalent
-- phone-based list yet, and consent is meaningless without the phone
-- number that already lives on this table.
--
-- MANUAL STEP: paste into the Supabase SQL Editor and run once.
-- ============================================================

alter table clients
  add column if not exists sms_marketing_consent boolean not null default false,
  add column if not exists whatsapp_marketing_consent boolean not null default false;
