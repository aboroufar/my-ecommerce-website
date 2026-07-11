import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MenuManager } from "@/components/admin/MenuManager";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: columns }, { data: items }, { data: categories }, settings] =
    await Promise.all([
      supabase
        .from("menu_columns")
        .select("id, title, enabled, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select("id, column_id, label, href, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .order("name", { ascending: true }),
      getSiteSettings(),
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
        The category column is built automatically from your{" "}
        <Link href="/admin/categories" className="text-accent underline underline-offset-4 hover:opacity-80">
          Categories page
        </Link>{" "}
        (including groups and items) -- edit categories there, not here.
        Add, edit, reorder, or remove extra columns and links below.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <MenuManager
          columns={columnsWithItems}
          categories={categories ?? []}
          categoriesMenuLabel={settings.categories_menu_label}
        />
      </div>
    </div>
  );
}
