import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsBulkTable } from "@/components/admin/ProductsBulkTable";
import { AdminProductsSidebar } from "@/components/admin/AdminProductsSidebar";

// Admins need to see live data including drafts/just-changed stock --
// no ISR caching here.
export const dynamic = "force-dynamic";

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
      .select("id, name, slug")
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
  const matchSlugs = categorySlugs.length > 0 ? new Set(categorySlugs) : null;

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
