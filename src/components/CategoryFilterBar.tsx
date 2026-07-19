"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Category } from "@/lib/products";

/**
 * Horizontal filter bar matching douglas.it's category-page pattern: a
 * scrollable row of category pills (siblings within the active department)
 * plus a "Price" chip that opens a small popover with the min/max form --
 * replacing the old left sidebar + full-width hero wallpaper for category
 * pages, where the product grid should be the focus.
 */
export function CategoryFilterBar({
  categories,
  activeSlug,
  allCategorySlug,
  minPrice,
  maxPrice,
}: {
  categories: Category[];
  activeSlug?: string;
  // The department-level category the "All" pill should reset to (e.g.
  // "Skincare"), or undefined for the unscoped /products listing.
  allCategorySlug?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  const t = useTranslations("categoryFilterBar");
  const [priceOpen, setPriceOpen] = useState(false);

  function categoryHref(slug?: string) {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pill href={categoryHref(allCategorySlug)} active={!activeSlug || activeSlug === allCategorySlug}>
            {t("allProducts")}
          </Pill>
          {categories.map((category) => (
            <Pill key={category.id} href={categoryHref(category.slug)} active={activeSlug === category.slug}>
              {category.name}
            </Pill>
          ))}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPriceOpen((v) => !v)}
            aria-expanded={priceOpen}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
              minPrice || maxPrice
                ? "border-foreground bg-foreground text-background"
                : "border-line text-foreground hover:border-foreground"
            }`}
          >
            {t("price")}
            <ChevronIcon open={priceOpen} />
          </button>

          {priceOpen && (
            <PricePopover
              minPrice={minPrice}
              maxPrice={maxPrice}
              onClose={() => setPriceOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-line text-foreground hover:border-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function PricePopover({
  minPrice,
  maxPrice,
  onClose,
}: {
  minPrice?: string;
  maxPrice?: string;
  onClose: () => void;
}) {
  const t = useTranslations("priceRangeFilter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(minPrice ?? "");
  const [max, setMax] = useState(maxPrice ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (min.trim()) params.set("minPrice", min.trim());
    else params.delete("minPrice");
    if (max.trim()) params.set("maxPrice", max.trim());
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-line bg-background p-4 shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">{t("minPrice")}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder={t("min")}
              className="w-full border border-line bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
            />
          </label>
          <span className="text-muted">–</span>
          <label className="flex-1">
            <span className="sr-only">{t("maxPrice")}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder={t("max")}
              className="w-full border border-line bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-3 w-full border border-line px-3 py-2 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
        >
          {t("apply")}
        </button>
      </form>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
