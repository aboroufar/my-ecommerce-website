"use client";

import { useState } from "react";

export interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
}

/**
 * Controlled (not FormData-name-based) checklist -- unlike TagChecklist,
 * this needs to report selections back to a parent that serializes them
 * into a single configJson blob (see DiscountForm), not read straight off
 * FormData by name. Text-filtered by name/SKU substring, same UX as the
 * search box in AdminProductsFilterBar.
 */
export function ProductChecklist({
  products,
  selectedIds,
  onChange,
}: {
  products: ProductOption[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = products.filter((p) => {
    if (!query.trim()) return true;
    const haystack = `${p.name} ${p.sku ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products by name or SKU"
        className="border border-line bg-background px-2.5 py-1.5 text-sm"
      />
      <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-line bg-background p-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">No matching products.</p>
        ) : (
          filtered.map((product) => (
            <label key={product.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selectedIds.has(product.id)}
                onChange={() => toggle(product.id)}
              />
              <span className="truncate">
                {product.name}
                {product.sku && <span className="ml-1 text-muted">({product.sku})</span>}
              </span>
            </label>
          ))
        )}
      </div>
      {selectedIds.size > 0 && (
        <span className="text-xs text-muted">{selectedIds.size} selected</span>
      )}
    </div>
  );
}
