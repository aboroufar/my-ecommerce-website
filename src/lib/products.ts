import { createPublicClient } from "@/lib/supabase/public";

export interface ProductImage {
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductCategoryRef {
  categories: { name: string; slug: string; parent_id: string | null } | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  stock_qty: number;
  product_images: ProductImage[];
  product_categories: ProductCategoryRef[];
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  sku: string | null;
  stock_qty: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
}

/**
 * Returns the slug set of the given category plus every descendant
 * (children, grandchildren, ...), so filtering by a top-level or
 * group-level category also picks up products tagged on the categories
 * nested underneath it.
 */
function descendantSlugs(categories: Category[], rootSlug: string): Set<string> {
  const root = categories.find((c) => c.slug === rootSlug);
  if (!root) return new Set([rootSlug]);

  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const slugs = new Set<string>([root.slug]);
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const child of childrenByParent.get(current.id) ?? []) {
      slugs.add(child.slug);
      stack.push(child);
    }
  }
  return slugs;
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
        "id, name, slug, description, price_cents, compare_at_price_cents, currency, stock_qty, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id))"
      )
      .eq("status", "active")
      .order(column, { ascending });

    if (error) {
      console.error("getActiveProducts error:", error.message);
      return [];
    }

    const products = data ?? [];
    if (!options?.categorySlug) return products;

    // Filtering by category needs to match not just the exact category but
    // also its descendants -- picking "Skincare" (a group-level category)
    // should also surface products tagged directly on "Face Cream Set" or
    // "Matte Foundation" underneath it. Client-side filtering (rather than
    // a dynamic !inner select string) avoids the type-inference breakage
    // postgrest-js has with computed select strings (see
    // src/lib/supabase/types.ts notes on Insert/Update literal shapes --
    // the same "computed types silently collapse to never" trap applies
    // to select-string interpolation here).
    const categories = await getCategories();
    const matchSlugs = descendantSlugs(categories, options.categorySlug);
    return products.filter((p) =>
      p.product_categories.some(
        (pc) => pc.categories && matchSlugs.has(pc.categories.slug)
      )
    );
  } catch (err) {
    console.error("getActiveProducts failed (Supabase not configured?):", err);
    return [];
  }
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
      .select("id, name, slug, image_url, parent_id")
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
 * Searches active products by name/description substring match.
 * Returns an empty array for a blank query, on error, or if Supabase isn't
 * configured yet.
 */
const PRODUCT_SEARCH_SELECT =
  "id, name, slug, description, price_cents, compare_at_price_cents, currency, stock_qty, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id))";

export async function searchProducts(query: string): Promise<ProductSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const supabase = createPublicClient();
    // Escape ilike wildcards (% _) so the query is treated as a literal
    // substring. Deliberately NOT using .or('name.ilike...,description...')
    // here -- PostgREST's logic-tree parser for .or()/.and() treats `,` and
    // `()` as structural syntax that can't be escaped away (confirmed: a
    // query containing a comma or parenthesis throws "failed to parse logic
    // tree" even with backslash-escaping). Running two plain .ilike() calls
    // and merging client-side sidesteps that parser entirely.
    const escaped = trimmed.replace(/[%_]/g, (char) => `\\${char}`);
    const pattern = `%${escaped}%`;

    const [byName, byDescription] = await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_SEARCH_SELECT)
        .eq("status", "active")
        .ilike("name", pattern),
      supabase
        .from("products")
        .select(PRODUCT_SEARCH_SELECT)
        .eq("status", "active")
        .ilike("description", pattern),
    ]);

    if (byName.error) console.error("searchProducts (name) error:", byName.error.message);
    if (byDescription.error)
      console.error("searchProducts (description) error:", byDescription.error.message);

    const seen = new Map<string, ProductSummary>();
    for (const product of [...(byName.data ?? []), ...(byDescription.data ?? [])]) {
      seen.set(product.id, product);
    }
    return [...seen.values()];
  } catch (err) {
    console.error("searchProducts failed (Supabase not configured?):", err);
    return [];
  }
}

/**
 * Products to show as "You may also like" on a product detail page:
 * other active products sharing at least one category with the given
 * product, newest first. Falls back to the newest active products overall
 * if the product has no categories or none of its category-mates are
 * still active, so the section is never empty without reason.
 */
export async function getRecommendedProducts(
  productId: string,
  categorySlugs: string[],
  limit = 4
): Promise<ProductSummary[]> {
  const all = await getActiveProducts();
  const others = all.filter((p) => p.id !== productId);

  if (categorySlugs.length > 0) {
    const sameCategory = others.filter((p) =>
      p.product_categories.some(
        (pc) => pc.categories && categorySlugs.includes(pc.categories.slug)
      )
    );
    if (sameCategory.length > 0) return sameCategory.slice(0, limit);
  }

  return others.slice(0, limit);
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
        "id, name, slug, description, price_cents, compare_at_price_cents, currency, sku, stock_qty, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id))"
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
