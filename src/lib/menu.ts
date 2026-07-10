import { createPublicClient } from "@/lib/supabase/public";

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  sort_order: number;
}

export interface MenuColumn {
  id: string;
  title: string;
  sort_order: number;
  items: MenuItem[];
}

/**
 * Fetches admin-managed mega-menu columns and their items. Returns an
 * empty array (rather than throwing) if Supabase isn't configured yet or
 * the request fails -- MegaMenu already renders fine with zero extra
 * columns (just the Category column stays).
 */
export async function getMenuColumns(): Promise<MenuColumn[]> {
  try {
    const supabase = createPublicClient();
    const { data: columns, error: columnsError } = await supabase
      .from("menu_columns")
      .select("id, title, sort_order")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (columnsError || !columns) {
      if (columnsError) console.error("getMenuColumns error:", columnsError.message);
      return [];
    }

    if (columns.length === 0) return [];

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select("id, column_id, label, href, sort_order")
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("getMenuColumns items error:", itemsError.message);
      return columns.map((c) => ({ ...c, items: [] }));
    }

    return columns.map((column) => ({
      ...column,
      items: (items ?? [])
        .filter((item) => item.column_id === column.id)
        .map(({ id, label, href, sort_order }) => ({ id, label, href, sort_order })),
    }));
  } catch (err) {
    console.error("getMenuColumns failed (Supabase not configured?):", err);
    return [];
  }
}
