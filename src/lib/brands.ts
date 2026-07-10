import { createPublicClient } from "@/lib/supabase/public";

export interface Brand {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  sort_order: number;
}

/**
 * Fetches admin-managed brands for the homepage brand bar. Returns an
 * empty array (rather than throwing) if Supabase isn't configured yet or
 * the request fails -- BrandBar renders nothing until real brands exist,
 * same no-fabrication pattern as every other section.
 */
export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, logo_url, link_url, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("getBrands error:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("getBrands failed (Supabase not configured?):", err);
    return [];
  }
}
