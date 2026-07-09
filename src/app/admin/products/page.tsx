import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsBulkTable } from "@/components/admin/ProductsBulkTable";

// Admins need to see live data including drafts/just-changed stock --
// no ISR caching here.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price_cents, currency, status, stock_qty")
    .order("created_at", { ascending: false });

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

      {!products || products.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No products yet. Click &quot;New product&quot; to add your first one.
        </p>
      ) : (
        <div className="mt-8">
          <ProductsBulkTable products={products} />
        </div>
      )}
    </div>
  );
}
