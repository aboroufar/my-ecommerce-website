"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Client wrapper for /products' sidebar + grid region -- holds the
 * "Hide filter" toggle state. Hiding the sidebar also expands the grid
 * to an extra column (matching the reference's behavior of using the
 * freed width), so both pieces are rendered as children/props here
 * rather than the server page trying to own this bit of UI state.
 */
export function ProductsGridLayout({
  sidebar,
  gridWithFilters,
  gridWithoutFilters,
  activeFilterCount,
}: {
  sidebar: React.ReactNode;
  // Passed as two pre-rendered variants (rather than a render-prop
  // function) since this is a Client Component receiving props from a
  // Server Component parent -- functions can't cross that boundary,
  // only serializable values/JSX.
  gridWithFilters: React.ReactNode;
  gridWithoutFilters: React.ReactNode;
  activeFilterCount: number;
}) {
  const t = useTranslations("productsPage");
  const [showFilters, setShowFilters] = useState(true);

  return (
    <div className="flex w-full flex-col gap-6">
      <button
        type="button"
        onClick={() => setShowFilters((prev) => !prev)}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
      >
        <FilterIcon />
        {showFilters
          ? `${t("hideFilter")} (${activeFilterCount})`
          : `${t("showFilter")} (${activeFilterCount})`}
      </button>

      <div className="flex w-full flex-col gap-10 lg:flex-row">
        {showFilters && sidebar}
        <div className="min-w-0 flex-1">
          {showFilters ? gridWithFilters : gridWithoutFilters}
        </div>
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
