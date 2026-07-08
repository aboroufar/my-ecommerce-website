import { createPublicClient } from "@/lib/supabase/public";

export interface ProductImage {
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  product_images: ProductImage[];
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  sku: string | null;
  stock_qty: number;
}

/**
 * Fetches all active products for the listing page, ordered newest first.
 * Returns an empty array (rather than throwing) if Supabase isn't configured
 * yet or the request fails, so the page can render a friendly empty state
 * instead of crashing.
 */
export async function getActiveProducts(): Promise<ProductSummary[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, price_cents, currency, product_images(url, alt_text, sort_order)"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getActiveProducts error:", error.message);
      return [];
    }
    return data ?? [];
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
        "id, name, slug, description, price_cents, currency, sku, stock_qty, product_images(url, alt_text, sort_order)"
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
