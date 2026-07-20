"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Filter sidebar for /admin/products. Every control writes straight into
 * the URL's search params (via router.push), matching the pattern already
 * used by SortDropdown/ShopSidebar on the storefront -- the admin page
 * itself reads those same params server-side and re-queries Supabase, so
 * filters are shareable/bookmarkable links and survive a page refresh.
 */
export function AdminProductsSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategorySlugs = new Set(
    searchParams.getAll("category")
  );
  const status = searchParams.get("status") ?? "";
  const stock = searchParams.get("stock") ?? "";
  const popular = searchParams.get("popular") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const q = searchParams.get("q") ?? "";

  const hasFilters =
    selectedCategorySlugs.size > 0 ||
    status ||
    stock ||
    popular ||
    minPrice ||
    maxPrice ||
    q;

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/admin/products?${params.toString()}`);
  }

  function toggleCategory(slug: string) {
    pushParams((params) => {
      const values = new Set(params.getAll("category"));
      if (values.has(slug)) values.delete(slug);
      else values.add(slug);
      params.delete("category");
      for (const v of values) params.append("category", v);
    });
  }

  function setParam(key: string, value: string) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function handlePriceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const min = String(form.get("min_price") ?? "").trim();
    const max = String(form.get("max_price") ?? "").trim();
    pushParams((params) => {
      if (min) params.set("min_price", min);
      else params.delete("min_price");
      if (max) params.set("max_price", max);
      else params.delete("max_price");
    });
  }

  return (
    <aside className="w-full shrink-0 space-y-6 border border-line bg-surface p-4 lg:w-64">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Filters
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="text-xs text-accent underline underline-offset-4 hover:opacity-80"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Search
          </span>
          <input
            type="search"
            defaultValue={q}
            placeholder="Name or SKU"
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("q", e.currentTarget.value.trim());
            }}
            onBlur={(e) => setParam("q", e.currentTarget.value.trim())}
            className="border border-line bg-background px-2.5 py-1.5 text-sm"
          />
        </label>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
            Categories
          </h3>
          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-1.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={selectedCategorySlugs.has(category.slug)}
                  onChange={() => toggleCategory(category.slug)}
                />
                <span className="truncate">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          Status
        </h3>
        <div className="mt-2 space-y-1.5">
          {(["active", "draft", "archived"] as const).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm capitalize text-foreground">
              <input
                type="radio"
                name="status"
                checked={status === value}
                onChange={() => setParam("status", status === value ? "" : value)}
                onClick={() => status === value && setParam("status", "")}
              />
              {value}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          Stock
        </h3>
        <div className="mt-2 space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="stock"
              checked={stock === "in"}
              onChange={() => setParam("stock", stock === "in" ? "" : "in")}
              onClick={() => stock === "in" && setParam("stock", "")}
            />
            In stock
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="stock"
              checked={stock === "out"}
              onChange={() => setParam("stock", stock === "out" ? "" : "out")}
              onClick={() => stock === "out" && setParam("stock", "")}
            />
            Out of stock
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          Price (USD)
        </h3>
        <form onSubmit={handlePriceSubmit} className="mt-2 flex items-center gap-2">
          <input
            type="number"
            name="min_price"
            min="0"
            step="0.01"
            defaultValue={minPrice}
            placeholder="Min"
            className="w-full border border-line bg-background px-2 py-1.5 text-sm"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            name="max_price"
            min="0"
            step="0.01"
            defaultValue={maxPrice}
            placeholder="Max"
            className="w-full border border-line bg-background px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 bg-accent px-2.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Go
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          Other
        </h3>
        <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={popular === "1"}
            onChange={() => setParam("popular", popular === "1" ? "" : "1")}
          />
          Popular badge only
        </label>
      </div>
    </aside>
  );
}
