import { createPublicClient } from "@/lib/supabase/public";

export interface ProductImage {
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductCategoryRef {
  categories: { name: string; slug: string; parent_id: string | null } | null;
}

// Only the field needed to compute a rating summary -- the full review
// (name/body/date) is fetched separately by getProductBySlug for the PDP.
export interface ProductRatingRef {
  rating: number;
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
  is_popular: boolean;
  product_images: ProductImage[];
  product_categories: ProductCategoryRef[];
  product_reviews: ProductRatingRef[];
}

export interface ProductOptionValue {
  id: string;
  label: string;
  sort_order: number;
}

export interface ProductOptionType {
  id: string;
  name: string;
  sort_order: number;
  product_option_values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  price_cents: number;
  stock_qty: number;
  weight_text: string | null;
  dimensions_text: string | null;
  product_variant_options: { option_value_id: string }[];
}

export interface ProductReview {
  id: string;
  reviewer_name: string;
  rating: number;
  body: string;
  created_at: string;
}

export interface ProductDetail extends Omit<ProductSummary, "product_reviews"> {
  description: string | null;
  sku: string | null;
  stock_qty: number;
  weight_text: string | null;
  dimensions_text: string | null;
  product_option_types: ProductOptionType[];
  product_variants: ProductVariant[];
  product_reviews: ProductReview[];
}

/**
 * Rounds to the nearest integer for star display (0 when there are no
 * reviews, so callers can hide the rating line/stars entirely rather than
 * showing a fabricated "0 stars").
 */
export function getReviewSummary(reviews: { rating: number }[]): {
  count: number;
  average: number;
} {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const sum = reviews.reduce((total, r) => total + r.rating, 0);
  return { count: reviews.length, average: Math.round(sum / reviews.length) };
}


/**
 * Given the option values currently selected (one per option type, keyed
 * by option_type_id -> option_value_id), finds the single product_variants
 * row whose set of option values exactly matches the selection -- or
 * undefined if the selection is incomplete or (shouldn't normally happen,
 * but data can be edited after the fact) doesn't correspond to any
 * existing variant.
 */
export function findMatchingVariant(
  product: { product_option_types: ProductOptionType[]; product_variants: ProductVariant[] },
  selections: Record<string, string>
): ProductVariant | undefined {
  const requiredCount = product.product_option_types.length;
  if (requiredCount === 0) return undefined;

  const selectedValueIds = new Set(Object.values(selections));
  if (selectedValueIds.size !== requiredCount) return undefined;

  return product.product_variants.find((variant) => {
    const variantValueIds = variant.product_variant_options.map((o) => o.option_value_id);
    return (
      variantValueIds.length === requiredCount &&
      variantValueIds.every((id) => selectedValueIds.has(id))
    );
  });
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
  hero_image_url: string | null;
  hero_headline: string | null;
  hero_eyebrow: string | null;
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
        "id, name, slug, description, price_cents, compare_at_price_cents, currency, stock_qty, is_popular, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id)), product_reviews(rating)"
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
 * Given the full category list and a Supabase client, returns the set of
 * category IDs that have at least one *active* product assigned -- either
 * directly, or on a descendant category. Shared by getCategories() (which
 * uses it to hide dead-end categories from the storefront) and the admin
 * categories page (which uses it to flag categories that exist but aren't
 * visible anywhere yet, e.g. because their only product is still a draft).
 */
export async function getCategoryIdsWithActiveProducts(
  supabase: ReturnType<typeof createPublicClient>,
  categories: Category[]
): Promise<Set<string>> {
  const { data: productCategories, error } = await supabase
    .from("product_categories")
    .select("category_id, products!inner(status)")
    .eq("products.status", "active");

  if (error) {
    console.error("getCategoryIdsWithActiveProducts error:", error.message);
    return new Set(categories.map((c) => c.id));
  }

  const directlyAssigned = new Set(
    (productCategories ?? []).map((pc) => pc.category_id)
  );

  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  function hasProductsInSubtree(category: Category): boolean {
    if (directlyAssigned.has(category.id)) return true;
    return (childrenByParent.get(category.id) ?? []).some(hasProductsInSubtree);
  }

  const result = new Set<string>();
  for (const c of categories) {
    if (hasProductsInSubtree(c)) result.add(c.id);
  }
  return result;
}

/**
 * Fetches all categories for nav/mega-menu use.
 * Returns an empty array (rather than throwing) if Supabase isn't configured
 * yet or the request fails.
 *
 * By default, only returns categories that have at least one active product
 * assigned -- directly, or on a descendant category -- so an empty
 * subcategory (created but not yet assigned any products) doesn't show up
 * as a dead end in the header menu, homepage grid, or /products filters.
 * Pass `includeEmpty: true` for admin UI that needs to manage every
 * category regardless of product count (the /admin/categories page already
 * queries Supabase directly rather than calling this, but this option
 * exists for any future admin consumer).
 */
export async function getCategories(options?: {
  includeEmpty?: boolean;
}): Promise<Category[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, image_url, parent_id, hero_image_url, hero_headline, hero_eyebrow")
      .order("name", { ascending: true });

    if (error) {
      console.error("getCategories error:", error.message);
      return [];
    }
    const categories = data ?? [];
    if (options?.includeEmpty) return categories;

    const visibleIds = await getCategoryIdsWithActiveProducts(supabase, categories);
    return categories.filter((c) => visibleIds.has(c.id));
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
  "id, name, slug, description, price_cents, compare_at_price_cents, currency, stock_qty, is_popular, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id)), product_reviews(rating)";

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
        "id, name, slug, description, price_cents, compare_at_price_cents, currency, sku, stock_qty, is_popular, weight_text, dimensions_text, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id)), product_option_types(id, name, sort_order, product_option_values(id, label, sort_order)), product_variants(id, sku, price_cents, stock_qty, weight_text, dimensions_text, product_variant_options(option_value_id)), product_reviews(id, reviewer_name, rating, body, created_at)"
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
