import { createPublicClient } from "@/lib/supabase/public";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogTagRef {
  blog_tags: { name: string; slug: string } | null;
}

export interface BlogCategoryRef {
  blog_categories: { name: string; slug: string } | null;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  blog_post_categories: BlogCategoryRef[];
}

export interface BlogPostDetail extends BlogPostSummary {
  body_html: string;
  blog_post_tag_links: BlogTagRef[];
  author_name: string;
  author_photo_url: string;
  author_bio: string;
  author_facebook_url: string;
  author_twitter_url: string;
  author_linkedin_url: string;
}

const POST_SUMMARY_SELECT =
  "id, title, slug, excerpt, cover_image_url, published_at, blog_post_categories(blog_categories(name, slug))";

/**
 * Published posts, newest first. Optionally filtered to one category or
 * tag slug -- mirrors getActiveProducts' categorySlug/tagSlug pattern.
 * Returns an empty array (rather than throwing) if Supabase isn't
 * configured yet or the request fails.
 */
export async function getPublishedPosts(options?: {
  categorySlug?: string;
  tagSlug?: string;
}): Promise<BlogPostSummary[]> {
  try {
    const supabase = createPublicClient();

    if (options?.tagSlug) {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`${POST_SUMMARY_SELECT}, blog_post_tag_links!inner(blog_tags!inner(slug))`)
        .eq("status", "published")
        .eq("blog_post_tag_links.blog_tags.slug", options.tagSlug)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("getPublishedPosts (tag) error:", error.message);
        return [];
      }
      return (data ?? []).map(({ blog_post_tag_links: _tags, ...post }) => post);
    }

    if (options?.categorySlug) {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          `${POST_SUMMARY_SELECT}, blog_post_categories!inner(blog_categories!inner(name, slug))`
        )
        .eq("status", "published")
        .eq("blog_post_categories.blog_categories.slug", options.categorySlug)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("getPublishedPosts (category) error:", error.message);
        return [];
      }
      return data ?? [];
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SUMMARY_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("getPublishedPosts error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getPublishedPosts failed (Supabase not configured?):", err);
    return [];
  }
}

/**
 * Searches published posts by title/excerpt substring match, same
 * ilike-with-escaped-wildcards pattern as searchProducts.
 */
export async function searchPosts(query: string): Promise<BlogPostSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const supabase = createPublicClient();
    const escaped = trimmed.replace(/[%_]/g, (c) => `\\${c}`);
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SUMMARY_SELECT)
      .eq("status", "published")
      .or(`title.ilike.%${escaped}%,excerpt.ilike.%${escaped}%`)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("searchPosts error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("searchPosts failed (Supabase not configured?):", err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, cover_image_url, body_html, published_at, author_name, author_photo_url, author_bio, author_facebook_url, author_twitter_url, author_linkedin_url, blog_post_categories(blog_categories(name, slug)), blog_post_tag_links(blog_tags(name, slug))"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("getPostBySlug error:", error.message);
      }
      return null;
    }
    return data;
  } catch (err) {
    console.error("getPostBySlug failed (Supabase not configured?):", err);
    return null;
  }
}

/**
 * Up to `limit` other published posts, preferring ones that share a
 * category with the given post -- same "same category, else just recent"
 * fallback as getRecommendedProducts.
 */
export async function getRelatedPosts(
  postId: string,
  categorySlugs: string[],
  limit = 3
): Promise<BlogPostSummary[]> {
  const all = await getPublishedPosts();
  const others = all.filter((p) => p.id !== postId);

  if (categorySlugs.length > 0) {
    const sameCategory = others.filter((p) =>
      p.blog_post_categories.some(
        (pc) => pc.blog_categories && categorySlugs.includes(pc.blog_categories.slug)
      )
    );
    if (sameCategory.length > 0) return sameCategory.slice(0, limit);
  }

  return others.slice(0, limit);
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("getBlogCategories error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getBlogCategories failed (Supabase not configured?):", err);
    return [];
  }
}

// blog_tags is its own pool, separate from product tags (getTags in
// src/lib/products.ts) and discount labels.
export async function getBlogTags(): Promise<BlogTag[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("blog_tags")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("getBlogTags error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getBlogTags failed (Supabase not configured?):", err);
    return [];
  }
}
