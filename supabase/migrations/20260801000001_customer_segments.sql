-- ============================================================
-- Customer segments
-- ============================================================
-- A segment is a saved, structured filter that matches a set of
-- customers -- e.g. "Customers who have purchased at least once".
-- Deliberately NOT raw SQL: `conditions` is a small structured JSON array
-- (field/operator/value), evaluated in application code against the
-- customers/orders/newsletter_subscribers tables via the normal query
-- builder. There is no existing raw-SQL-execution path in this codebase
-- (every other admin feature goes through postgrest-js), and letting an
-- admin-entered text field run arbitrary SQL server-side is a real
-- injection surface not worth taking on for what a handful of simple
-- structured conditions already cover.
--
-- condition_type distinguishes the one sample segment ("Abandoned
-- checkouts in the last 30 days") that has no real backing data yet --
-- this app's cart/checkout flow is client-side localStorage only, with no
-- server-side abandoned-checkout tracking. That segment is seeded so it
-- shows in the list (matching the reference screenshot) but always
-- resolves to 0 matching customers until real cart tracking exists.
create table if not exists customer_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  condition_type text not null default 'conditions'
    check (condition_type in ('conditions', 'abandoned_checkout')),
  conditions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Unlike categories/brands/menu_items, segments are never rendered on the
-- storefront -- only read/written through admin server actions using the
-- service-role client, which bypasses RLS entirely. RLS is still enabled
-- with no policies (default-deny) so the anon/authenticated roles used by
-- public-facing queries can't read this table even by accident.
alter table customer_segments enable row level security;

-- Seed the 5 sample segments once, on first run only -- guarded by a row
-- count rather than a unique constraint on name, since segment names are
-- admin-editable free text and shouldn't be forced unique going forward.
insert into customer_segments (name, condition_type, conditions)
select * from (
  values
    (
      'Customers who have purchased at least once',
      'conditions',
      '[{"field": "order_count", "operator": "gte", "value": 1}]'::jsonb
    ),
    (
      'Email subscribers',
      'conditions',
      '[{"field": "email_subscribed", "operator": "eq", "value": true}]'::jsonb
    ),
    (
      'Abandoned checkouts in the last 30 days',
      'abandoned_checkout',
      '[]'::jsonb
    ),
    (
      'Customers who have purchased more than once',
      'conditions',
      '[{"field": "order_count", "operator": "gte", "value": 2}]'::jsonb
    ),
    (
      'Customers who haven''t purchased',
      'conditions',
      '[{"field": "order_count", "operator": "eq", "value": 0}]'::jsonb
    )
) as seed(name, condition_type, conditions)
where not exists (select 1 from customer_segments);
