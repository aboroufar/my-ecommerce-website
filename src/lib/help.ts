import { createPublicClient } from "@/lib/supabase/public";

export interface HelpTopic {
  id: string;
  title: string;
  body_html: string;
  sort_order: number;
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  topics: HelpTopic[];
}

/**
 * Fetches Help Center categories and their topics. Returns an empty array
 * (rather than throwing) if Supabase isn't configured yet or the request
 * fails -- matches every other public data-fetcher in this codebase.
 */
export async function getHelpCategories(): Promise<HelpCategory[]> {
  try {
    const supabase = createPublicClient();
    const { data: categories, error: categoriesError } = await supabase
      .from("help_categories")
      .select("id, title, description, icon, sort_order")
      .order("sort_order", { ascending: true });

    if (categoriesError || !categories) {
      if (categoriesError) console.error("getHelpCategories error:", categoriesError.message);
      return [];
    }

    if (categories.length === 0) return [];

    const { data: topics, error: topicsError } = await supabase
      .from("help_topics")
      .select("id, category_id, title, body_html, sort_order")
      .order("sort_order", { ascending: true });

    if (topicsError) {
      console.error("getHelpCategories topics error:", topicsError.message);
      return categories.map((c) => ({ ...c, topics: [] }));
    }

    return categories.map((category) => ({
      ...category,
      topics: (topics ?? [])
        .filter((topic) => topic.category_id === category.id)
        .map(({ id, title, body_html, sort_order }) => ({ id, title, body_html, sort_order })),
    }));
  } catch (err) {
    console.error("getHelpCategories failed (Supabase not configured?):", err);
    return [];
  }
}
