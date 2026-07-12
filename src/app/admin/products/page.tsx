import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsBulkTable } from "@/components/admin/ProductsBulkTable";
import { AdminProductsSidebar } from "@/components/admin/AdminProductsSidebar";

// Admins need to see live data including drafts/just-changed stock --
// no ISR caching here.
export const dynamic = "force-dynamic";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

/**
 * Returns the given category slugs plus every descendant slug (so
 * filtering by a top-level Category also matches products tagged on its
 * Groups/Items underneath) -- same approach as the storefront's
 * descendantSlugs() in src/lib/products.ts, duplicated here rather than
 * imported since that helper is scoped to the public client/active-only
 * product view and this needs to work against the admin client with no
 * status filter.
 */
function expandToDescendants(categories: Category[], slugs: string[]): Set<string> {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const result = new Set<string>();
  for (const slug of slugs) {
    const root = bySlug.get(slug);
    if (!root) continue;
    const stack = [root];
    while (stack.length > 0) {
      const current = stack.pop()!;
      result.add(current.slug);
      for (const child of childrenByParent.get(current.id) ?? []) {
        stack.push(child);
      }
    }
  }
  return result;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    category?: string | string[];
    status?: string;
    stock?: string;
    popular?: string;
    min_price?: string;
    max_price?: string;
    q?: string;
  }>;
}) {
  const {
    error,
    category,
    status,
    stock,
    popular,
    min_price,
    max_price,
    q,
  } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: categories }, { data: allProducts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, name, slug, sku, price_cents, currency, status, stock_qty, is_popular, product_categories(categories(slug))"
      )
      .order("created_at", { ascending: false }),
  ]);

  const categorySlugs = category
    ? Array.isArray(category)
      ? category
      : [category]
    : [];
  const matchSlugs =
    categorySlugs.length > 0
      ? expandToDescendants(categories ?? [], categorySlugs)
      : null;

  const minCents = min_price ? Math.round(parseFloat(min_price) * 100) : null;
  const maxCents = max_price ? Math.round(parseFloat(max_price) * 100) : null;
  const query = q?.trim().toLowerCase() ?? "";

  const products = (allProducts ?? []).filter((p) => {
    if (matchSlugs) {
      const productSlugs = p.product_categories
        .map((pc) => pc.categories?.slug)
        .filter((s): s is string => !!s);
      if (!productSlugs.some((s) => matchSlugs.has(s))) return false;
    }
    if (status && p.status !== status) return false;
    if (stock === "in" && p.stock_qty <= 0) return false;
    if (stock === "out" && p.stock_qty > 0) return false;
    if (popular === "1" && !p.is_popular) return false;
    if (minCents !== null && p.price_cents < minCents) return false;
    if (maxCents !== null && p.price_cents > maxCents) return false;
    if (query) {
      const haystack = `${p.name} ${p.sku ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const hasAnyFilter =
    categorySlugs.length > 0 || status || stock || popular || min_price || max_price || q;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          New product
        </Link>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!allProducts || allProducts.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No products yet. Click &quot;New product&quot; to add your first one.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <AdminProductsSidebar categories={categories ?? []} />

          <div className="min-w-0 flex-1">
            <p className="mb-3 text-xs text-muted">
              {products.length} of {allProducts.length} product
              {allProducts.length === 1 ? "" : "s"}
            </p>
            {products.length === 0 ? (
              <p className="text-sm text-muted">
                No products match these filters.
                {hasAnyFilter && (
                  <>
                    {" "}
                    <Link
                      href="/admin/products"
                      className="text-accent underline underline-offset-4"
                    >
                      Clear filters
                    </Link>
                  </>
                )}
              </p>
            ) : (
              <ProductsBulkTable products={products} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
