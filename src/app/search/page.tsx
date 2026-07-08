import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { SearchBox } from "@/components/SearchBox";

export const metadata: Metadata = {
  title: "Search — Storefront",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const products = query ? await searchProducts(query) : [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Search
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          {query ? `Results for “${query}”` : "Search products"}
        </h1>
      </div>

      <SearchBox initialQuery={query} />

      <div className="mt-10">
        {!query ? (
          <p className="text-sm text-muted">
            Enter a search term above to find products.
          </p>
        ) : products.length === 0 ? (
          <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-lg text-foreground">
              No products found for “{query}”.
            </p>
            <Link
              href="/products"
              className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
