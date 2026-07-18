"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { ProductSort } from "@/lib/products";

export function SortDropdown({ current }: { current: ProductSort }) {
  const t = useTranslations("sortDropdown");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortLabels: Record<ProductSort, string> = {
    newest: t("newest"),
    "price-asc": t("priceAsc"),
    "price-desc": t("priceDesc"),
    "name-asc": t("nameAsc"),
  };

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative inline-flex items-center border border-line">
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-background px-4 py-2.5 pr-9 text-sm text-foreground focus:outline-none"
        aria-label={t("ariaLabel")}
      >
        {Object.entries(sortLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute right-3 h-3 w-3 text-muted"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
