"use client";

import { useMemo, useState } from "react";
import type { ProductSearchOption } from "./PurchaseOrderLineItems";

/**
 * "Add products" modal for the purchase order line-item builder --
 * replaces the earlier type-to-filter-and-click-one-at-a-time dropdown
 * with a proper checkbox-multi-select dialog (search, image, name,
 * available stock), matching Shopify's own purchase order product
 * picker. Same backdrop-modal pattern as DiscountTypeModal.
 */
export function AddProductsModal({
  options,
  alreadyAddedKeys,
  onAdd,
}: {
  options: ProductSearchOption[];
  alreadyAddedKeys: Set<string>;
  onAdd: (selected: ProductSearchOption[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((o) => {
      const haystack = `${o.productName} ${o.variantLabel ?? ""} ${o.sku ?? ""}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [options, query]);

  function keyOf(option: ProductSearchOption) {
    return `${option.productId}:${option.variantId ?? ""}`;
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function close() {
    setOpen(false);
    setQuery("");
    setSelected(new Set());
  }

  function handleAdd() {
    const chosen = options.filter((o) => selected.has(keyOf(o)));
    onAdd(chosen);
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 border border-line bg-background px-3 py-2 text-left text-sm text-muted hover:border-foreground"
      >
        <SearchIcon className="h-4 w-4 shrink-0" />
        Search products to add
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Add products</h2>
              <button
                type="button"
                onClick={close}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-line px-5 py-3">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full border border-line bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No matching products.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pl-5 font-medium">Product</th>
                      <th className="py-2 pr-5 text-right font-medium">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((option) => {
                      const key = keyOf(option);
                      const alreadyAdded = alreadyAddedKeys.has(key);
                      return (
                        <tr key={key} className={alreadyAdded ? "opacity-50" : undefined}>
                          <td className="py-2.5 pl-5">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selected.has(key) || alreadyAdded}
                                disabled={alreadyAdded}
                                onChange={() => toggle(key)}
                              />
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-background">
                                {option.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- small admin-only thumbnail, not worth next/image's overhead here
                                  <img
                                    src={option.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs text-muted">—</span>
                                )}
                              </span>
                              <span className="truncate text-foreground">
                                {option.productName.toUpperCase()}
                                {option.variantLabel && (
                                  <span className="text-muted"> — {option.variantLabel}</span>
                                )}
                                {alreadyAdded && (
                                  <span className="ml-2 text-xs text-muted">(added)</span>
                                )}
                              </span>
                            </label>
                          </td>
                          <td className="py-2.5 pr-5 text-right text-muted">{option.stockQty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="text-xs text-muted">
                {selected.size} variant{selected.size === 1 ? "" : "s"} selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={selected.size === 0}
                  className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Add to purchase order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.5-4.5" strokeLinecap="round" />
    </svg>
  );
}
