"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category, ProductSummary } from "@/lib/products";
import { getSaleInfo } from "@/lib/format";
import { ProductCard } from "./ProductCard";

/**
 * One predictable product per category, keyed by category id. Mirrors the
 * stable spotlight pattern used by BestSellers -- teases every department's sale
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
      return inCategory[0];
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
  const t = useTranslations("saleSection");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const saleProducts = useMemo(
    () => products.filter((p) => getSaleInfo(p.price_cents, p.compare_at_price_cents).onSale),
    [products]
  );

  const spotlight = useMemo(
    () => pickOnePerCategory(saleProducts, categories),
    [saleProducts, categories]
  );

  const visibleProducts = useMemo(() => {
    if (!activeSlug) return spotlight;
    return saleProducts.filter((p) =>
      p.product_categories.some((pc) => pc.categories?.slug === activeSlug)
    );
  }, [saleProducts, activeSlug, spotlight]);

  if (saleProducts.length === 0 || categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">
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
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
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
          href="/promo"
          className="inline-block rounded-full border border-foreground px-8 py-3.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          {t("viewAll")}
        </Link>
      </div>
    </section>
  );
}
