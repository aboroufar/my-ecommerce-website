"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Category, ProductSummary } from "@/lib/products";
import { getSaleInfo } from "@/lib/format";
import { ProductCard } from "./ProductCard";

const ROTATE_INTERVAL_MS = 2000;

/**
 * One random product per category, keyed by category id. Mirrors the same
 * spotlight pattern used by BestSellers -- teases every department's sale
 * items without listing all of them; shoppers click "View all" (-> /promo)
 * for the full list.
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

/**
 * Real sale products only -- filtered from compare_at_price_cents, the same
 * field that drives the "Sale" badge on ProductCard. No countdown timer:
 * there's no real sale-end timestamp anywhere in the schema, and a fake one
 * would just be manufactured urgency.
 */
export function SaleSection({
  products,
  categories,
}: {
  products: ProductSummary[];
  categories: Category[];
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const saleProducts = useMemo(
    () => products.filter((p) => getSaleInfo(p.price_cents, p.compare_at_price_cents).onSale),
    [products]
  );

  const [spotlight, setSpotlight] = useState<ProductSummary[]>(() =>
    pickOnePerCategory(saleProducts, categories)
  );

  // Only rotates the one-per-category spotlight, and only while "Show all"
  // (no category filter) is active -- picking a specific category shows
  // every matching sale product instead, which shouldn't shuffle underfoot.
  useEffect(() => {
    if (activeSlug) return;
    const timer = setInterval(() => {
      setSpotlight(pickOnePerCategory(saleProducts, categories));
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeSlug, saleProducts, categories]);

  const visibleProducts = useMemo(() => {
    if (!activeSlug) return spotlight;
    return saleProducts.filter((p) =>
      p.product_categories.some((pc) => pc.categories?.slug === activeSlug)
    );
  }, [saleProducts, activeSlug, spotlight]);

  if (saleProducts.length === 0 || categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">
          Products on sale
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
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-muted">
          No sale products in this category yet.
        </p>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/promo"
          className="inline-block rounded-full border border-foreground px-8 py-3.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          View all
        </Link>
      </div>
    </section>
  );
}
