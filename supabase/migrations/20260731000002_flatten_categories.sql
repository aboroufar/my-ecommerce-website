-- ============================================================
-- Flatten categories to a single tier
-- ============================================================
-- The admin UI and storefront no longer offer a "Group" tier nested under
-- a top-level Category -- finer-grained groupings are meant to use tags
-- instead. Promote every existing Group (a category with a non-null
-- parent_id) to top-level by clearing its parent_id. Nothing is deleted
-- and no product_categories assignments change; this only affects where
-- a category sits in the (now-flat) hierarchy.

update categories set parent_id = null where parent_id is not null;

-- parent_id itself is left in place (still nullable, still a real column)
-- rather than dropped -- the column isn't read by the admin form or any
-- storefront query path anymore, but keeping it avoids a destructive
-- schema change for a column that costs nothing to leave unused.
