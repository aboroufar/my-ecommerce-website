import { createPublicClient } from "@/lib/supabase/public";

export interface ProductImage {
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductCategoryRef {
  categories: { name: string; slug: string } | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  product_images: ProductImage[];
  product_categories: ProductCategoryRef[];
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  sku: string | null;
  stock_qty: number;
}

export type ProductSort = "newest" | "price-asc" | "price-desc" | "name-asc";

const sortColumns: Record<ProductSort, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  "price-asc": { column: "price_cents", ascending: true },
  "price-desc": { column: "price_cents", ascending: false },
  "name-asc": { column: "name", ascending: true },
};

/**
 * Fetches active products for the listing page, optionally filtered by
 * category slug and sorted. Returns an empty array (rather than throwing)
 * if Supabase isn't configured yet or the request fails, so the page can
 * render a friendly empty state instead of crashing.
 */
export async function getActiveProducts(options?: {
  categorySlug?: string;
  sort?: ProductSort;
}): Promise<ProductSummary[]> {
  try {
    const supabase = createPublicClient();
    const { column, ascending } = sortColumns[options?.sort ?? "newest"];

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, price_cents, currency, product_images(url, alt_text, sort_order), product_categories(categories(name, slug))"
      )
      .eq("status", "active")
      .order(column, { ascending });

    if (error) {
      console.error("getActiveProducts error:", error.message);
      return [];
    }

    const products = data ?? [];
    if (!options?.categorySlug) return products;

    // Filter by category client-side: with only two categories and a
    // handful of products, this avoids the type-inference breakage that
    // dynamic !inner select strings cause with postgrest-js (see
    // src/lib/supabase/types.ts notes on Insert/Update literal shapes --
    // the same "computed types silently collapse to never" trap applies
    // to select-string interpolation here).
    return products.filter((p) =>
      p.product_categories.some(
        (pc) => pc.categories?.slug === options.categorySlug
      )
    );
  } catch (err) {
    console.error("getActiveProducts failed (Supabase not configured?):", err);
    return [];
  }
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Fetches all categories for nav/mega-menu use.
 * Returns an empty array (rather than throwing) if Supabase isn't configured
 * yet or the request fails.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("getCategories error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getCategories failed (Supabase not configured?):", err);
    return [];
  }
}

/**
 * Fetches a single active product by slug for the detail page.
 * Returns null if not found, not active, or Supabase isn't reachable.
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, price_cents, currency, sku, stock_qty, product_images(url, alt_text, sort_order), product_categories(categories(name, slug))"
      )
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        // PGRST116 = no rows found, expected for a bad slug -- don't log noise
        console.error("getProductBySlug error:", error.message);
      }
      return null;
    }
    return data;
  } catch (err) {
    console.error("getProductBySlug failed (Supabase not configured?):", err);
    return null;
  }
}
