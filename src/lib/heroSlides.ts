import { createPublicClient } from "@/lib/supabase/public";

export interface HeroSlide {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

/**
 * Fetches admin-managed hero slides, ordered for display. Returns an empty
 * array (rather than throwing) if Supabase isn't configured yet or the
 * request fails, so the homepage can render a plain fallback instead of
 * crashing -- same pattern as getActiveProducts/getCategories.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("hero_slides")
      .select("id, headline, description, image_url, link_url, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("getHeroSlides error:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("getHeroSlides failed (Supabase not configured?):", err);
    return [];
  }
}
