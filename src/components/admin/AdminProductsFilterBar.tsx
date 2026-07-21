"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Top search/filter bar for /admin/products -- mirrors
 * AdminOrdersFilterBar's horizontal layout instead of a vertical sidebar.
 * Every control writes straight into the URL's search params
 * (router.push), so filters stay shareable/bookmarkable and survive a
 * page refresh.
 */
export function AdminProductsFilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const selectedCategorySlugs = new Set(searchParams.getAll("category"));
  const status = searchParams.get("status") ?? "";
  const stock = searchParams.get("stock") ?? "";
  const popular = searchParams.get("popular") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const q = searchParams.get("q") ?? "";

  const hasFilters =
    selectedCategorySlugs.size > 0 || status || stock || popular || minPrice || maxPrice || q;

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
    <div className="flex flex-col gap-3 border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          defaultValue={q}
          placeholder="Search name or SKU"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", e.currentTarget.value.trim());
          }}
          onBlur={(e) => setParam("q", e.currentTarget.value.trim())}
          className="min-w-[220px] flex-1 border border-line bg-background px-3 py-1.5 text-sm"
        />

        {categories.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              className="border border-line bg-background px-2.5 py-1.5 text-sm"
            >
              Categories{selectedCategorySlugs.size > 0 ? ` (${selectedCategorySlugs.size})` : ""}
            </button>
            {categoriesOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setCategoriesOpen(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto border border-line bg-surface p-2 shadow-md">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-1.5 px-1 py-1 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategorySlugs.has(category.slug)}
                        onChange={() => toggleCategory(category.slug)}
                      />
                      <span className="truncate">{category.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="border border-line bg-background px-2.5 py-1.5 text-sm capitalize"
        >
          <option value="">All statuses</option>
          {(["active", "draft", "archived"] as const).map((value) => (
            <option key={value} value={value} className="capitalize">
              {value}
            </option>
          ))}
        </select>

        <select
          value={stock}
          onChange={(e) => setParam("stock", e.target.value)}
          className="border border-line bg-background px-2.5 py-1.5 text-sm"
        >
          <option value="">All stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>

        <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5">
          <input
            type="number"
            name="min_price"
            min="0"
            step="0.01"
            defaultValue={minPrice}
            placeholder="Min €"
            className="w-20 border border-line bg-background px-2 py-1.5 text-sm"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            name="max_price"
            min="0"
            step="0.01"
            defaultValue={maxPrice}
            placeholder="Max €"
            className="w-20 border border-line bg-background px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 bg-accent px-2.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Go
          </button>
        </form>

        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={popular === "1"}
            onChange={() => setParam("popular", popular === "1" ? "" : "1")}
          />
          Popular
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="ml-auto text-xs text-accent underline underline-offset-4 hover:opacity-80"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
