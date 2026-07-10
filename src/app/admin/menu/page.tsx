import { createAdminClient } from "@/lib/supabase/admin";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const supabase = createAdminClient();
  const [{ data: columns }, { data: items }] = await Promise.all([
    supabase
      .from("menu_columns")
      .select("id, title, enabled, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, column_id, label, href, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const columnsWithItems = (columns ?? []).map((column) => ({
    ...column,
    items: (items ?? []).filter((item) => item.column_id === column.id),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        Navigation menu
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        The Category column in the header menu is built automatically from
        your categories. Add extra columns here (e.g. &quot;Concern&quot; or
        &quot;Collection&quot;) with their own links.
      </p>

      <div className="mt-8">
        <MenuManager columns={columnsWithItems} />
      </div>
    </div>
  );
}
