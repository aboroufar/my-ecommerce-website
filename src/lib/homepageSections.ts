import { createPublicClient } from "@/lib/supabase/public";

export type HomepageSectionKey =
  | "hero"
  | "category_grid"
  | "sale"
  | "promo_banner"
  | "best_sellers"
  | "journal"
  | "newsletter_photo"
  | "brand_bar";

export interface HomepageSection {
  key: HomepageSectionKey;
  label: string;
  enabled: boolean;
  sort_order: number;
}

/**
 * Default section list/order, used as a fallback if Supabase isn't
 * configured yet or the table is empty -- the homepage must always
 * render something sensible even before this table is seeded.
 */
const defaults: HomepageSection[] = [
  { key: "hero", label: "Hero slideshow", enabled: true, sort_order: 0 },
  { key: "category_grid", label: "Brand highlights", enabled: true, sort_order: 1 },
  { key: "sale", label: "Products on sale", enabled: true, sort_order: 2 },
  { key: "promo_banner", label: "Promo banner", enabled: true, sort_order: 3 },
  { key: "best_sellers", label: "Top bestsellers", enabled: true, sort_order: 4 },
  { key: "journal", label: "Journal / editorial posts", enabled: true, sort_order: 5 },
  { key: "newsletter_photo", label: "Newsletter signup (photo)", enabled: true, sort_order: 6 },
  { key: "brand_bar", label: "Brand bar", enabled: true, sort_order: 7 },
];

/**
 * Fetches admin-managed homepage section visibility/order. Returns the
 * hardcoded defaults (rather than throwing) if Supabase isn't configured
 * yet or the request fails.
 */
export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("key, label, enabled, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("getHomepageSections error:", error.message);
      return defaults;
    }

    return data as HomepageSection[];
  } catch (err) {
    console.error("getHomepageSections failed (Supabase not configured?):", err);
    return defaults;
  }
}
