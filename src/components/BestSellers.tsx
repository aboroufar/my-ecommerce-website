"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "./ProductCard";
import type { Category, ProductSummary } from "@/lib/products";

/**
 * One predictable product per category, keyed by category id. Used for the
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
      return inCategory[0];
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
  const t = useTranslations("bestSellers");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const spotlight = useMemo(() => pickOnePerCategory(products, categories), [products, categories]);

  const visibleProducts = useMemo(() => {
    if (!activeSlug) return spotlight;
    return products.filter((p) =>
      p.product_categories.some((pc) => pc.categories?.slug === activeSlug)
    );
  }, [products, activeSlug, spotlight]);

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {t("eyebrow")}
        </span>
        <h2 className="mt-2 font-display text-4xl font-bold text-foreground">
          {t("heading")}
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
          {t("showAll")}
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
          {t("emptyCategory")}
        </p>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/products"
          className="inline-block rounded-full border border-foreground px-8 py-3.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          {t("viewAll")}
        </Link>
      </div>
    </section>
  );
}
