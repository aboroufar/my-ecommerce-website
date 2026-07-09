-- site_content is rendered on the public homepage/footer (via the anon-key
-- public client, same as products/categories), so unlike admin-only tables
-- it needs a public SELECT policy. Writes still go through service_role
-- only (no INSERT/UPDATE/DELETE policy for anon/authenticated).

create policy "Public can view site content"
  on site_content for select
  to anon, authenticated
  using (true);
