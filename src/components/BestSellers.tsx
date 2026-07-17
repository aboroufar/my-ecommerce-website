"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Category, ProductSummary } from "@/lib/products";

const ROTATE_INTERVAL_MS = 2000;

/**
 * One random product per category, keyed by category id. Used for the
 * "Show all" spotlight view so the section teases every department
 * without listing every product -- shoppers click "View all" for the
 * full catalog.
 */
function pickOnePerCategory(
  products: ProductSummary[],
  categories: Category[]
): ProductSummary[] {
  return categories
    .map((category) => {
      const inCategory = products.filter((p) =>
        p.product_categories.some((pc) => pc.categories?.slug === category.slug)
      );
      if (inCategory.length === 0) return null;
      return inCategory[Math.floor(Math.random() * inCategory.length)];
    })
    .filter((p): p is ProductSummary => p !== null);
}

export function BestSellers({
  products,
  categories,
}: {
  products: ProductSummary[];
  categories: Category[];
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<ProductSummary[]>(() =>
    pickOnePerCategory(products, categories)
  );

  // Only rotates the one-per-category spotlight, and only while "Show all"
  // (no category filter) is active -- picking a specific category shows
  // every matching product instead, which shouldn't shuffle underfoot.
  useEffect(() => {
    if (activeSlug) return;
    const timer = setInterval(() => {
      setSpotlight(pickOnePerCategory(products, categories));
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeSlug, products, categories]);

  const visibleProducts = useMemo(() => {
    if (!activeSlug) return spotlight;
    return products.filter((p) =>
      p.product_categories.some((pc) => pc.categories?.slug === activeSlug)
    );
  }, [products, activeSlug, spotlight]);

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Everything you may need
        </span>
        <h2 className="mt-2 font-display text-4xl font-bold text-foreground">
          Top Bestsellers
        </h2>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSlug(null)}
          className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
            activeSlug === null
              ? "bg-foreground text-background"
              : "bg-surface text-foreground hover:bg-line/60"
          }`}
        >
          Show all
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveSlug(category.slug)}
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeSlug === category.slug
                ? "bg-foreground text-background"
                : "bg-surface text-foreground hover:bg-line/60"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {visibleProducts.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
