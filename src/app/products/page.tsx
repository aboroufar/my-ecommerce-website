import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop — Storefront",
  description: "Browse the full catalog.",
};

export default async function ProductsPage() {
  const products = await getActiveProducts();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Catalog
        </span>
        <h1 className="mt-2 font-display text-3xl text-foreground">
          Shop all
        </h1>
      </div>

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg text-foreground">
        No products yet.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Once your Supabase project is connected and migrated, products marked{" "}
        <code className="text-xs">status = &apos;active&apos;</code> will show up
        here automatically. Run <code className="text-xs">supabase/seed.sql</code>{" "}
        for sample data.
      </p>
    </div>
  );
}
