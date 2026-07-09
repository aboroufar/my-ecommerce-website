"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Category, ProductSummary } from "@/lib/products";

export function BestSellers({
  products,
  categories,
}: {
  products: ProductSummary[];
  categories: Category[];
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    categories[0]?.slug ?? null
  );

  const visibleProducts = useMemo(() => {
    if (!activeSlug) return products;
    return products.filter((p) =>
      p.product_categories.some((pc) => pc.categories?.slug === activeSlug)
    );
  }, [products, activeSlug]);

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <h2 className="text-center font-display text-5xl font-bold text-foreground">
        Best Sellers
      </h2>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveSlug(category.slug)}
            className={`rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeSlug === category.slug
                ? "bg-accent text-background"
                : "bg-surface text-foreground hover:bg-line/60"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {visibleProducts.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-muted">
          No products in this category yet.
        </p>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/products"
          className="inline-block rounded-full border border-foreground px-8 py-3.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          View all
        </Link>
      </div>
    </section>
  );
}
