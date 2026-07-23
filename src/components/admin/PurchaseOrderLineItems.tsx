"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";

export interface ProductSearchOption {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  sku: string | null;
}

export interface LineItem {
  key: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  quantity_ordered: number;
  unit_cost_cents: number;
}

/**
 * Search-and-add product picker for a purchase order's line items, plus
 * the growing editable list itself. No reusable "search products, add as
 * a row with qty/cost" component existed anywhere in this codebase (the
 * closest thing, ProductChecklist, is a checkbox toggle against a fixed
 * preloaded list for discount scoping -- not a growing list with per-row
 * inputs), so this is built fresh, filtering the same preloaded
 * `options` array client-side by name/SKU substring like ProductChecklist
 * does, rather than a debounced server round-trip this app has no
 * existing pattern for.
 */
export function PurchaseOrderLineItems({
  options,
  initialItems = [],
  currency,
}: {
  options: ProductSearchOption[];
  initialItems?: LineItem[];
  currency: string;
}) {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return options
      .filter((o) => {
        const haystack = `${o.productName} ${o.variantLabel ?? ""} ${o.sku ?? ""}`.toLowerCase();
        return haystack.includes(trimmed);
      })
      .slice(0, 20);
  }, [options, query]);

  function addItem(option: ProductSearchOption) {
    const key = `${option.productId}:${option.variantId ?? ""}`;
    setItems((prev) => {
      if (prev.some((i) => i.key === key)) return prev;
      return [
        ...prev,
        {
          key,
          product_id: option.productId,
          variant_id: option.variantId,
          product_name: option.productName,
          variant_label: option.variantLabel,
          quantity_ordered: 1,
          unit_cost_cents: 0,
        },
      ];
    });
    setQuery("");
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const totalCents = items.reduce((sum, i) => sum + i.quantity_ordered * i.unit_cost_cents, 0);
  const totalVariants = items.length;
  const totalItems = items.reduce((sum, i) => sum + i.quantity_ordered, 0);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          items.map(({ key: _key, ...rest }) => rest)
        )}
      />

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products to add"
          className="w-full border border-line bg-background px-3 py-2 text-sm"
        />
        {filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto border border-line bg-background text-sm shadow-sm">
            {filtered.map((option) => (
              <li key={`${option.productId}:${option.variantId ?? ""}`}>
                <button
                  type="button"
                  onClick={() => addItem(option)}
                  className="block w-full px-3 py-2 text-left hover:bg-accent-soft"
                >
                  {option.productName}
                  {option.variantLabel && (
                    <span className="text-muted"> — {option.variantLabel}</span>
                  )}
                  {option.sku && <span className="ml-1 text-xs text-muted">({option.sku})</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No products added yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Product</th>
              <th className="w-24 py-2 font-medium">Qty</th>
              <th className="w-32 py-2 font-medium">Unit cost</th>
              <th className="w-28 py-2 text-right font-medium">Total</th>
              <th className="w-8 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.key}>
                <td className="py-2 text-foreground">
                  {item.product_name}
                  {item.variant_label && (
                    <span className="text-muted"> — {item.variant_label}</span>
                  )}
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity_ordered}
                    onChange={(e) =>
                      updateItem(item.key, {
                        quantity_ordered: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-20 border border-line bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={(item.unit_cost_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      updateItem(item.key, {
                        unit_cost_cents: Math.max(0, Math.round(Number(e.target.value) * 100) || 0),
                      })
                    }
                    className="w-28 border border-line bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2 text-right text-foreground">
                  {formatPrice(item.quantity_ordered * item.unit_cost_cents, currency, "en")}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-muted hover:text-red-700"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="border-t border-line pt-3 text-sm">
        <div className="flex justify-between text-muted">
          <span>
            {totalVariants} variant{totalVariants === 1 ? "" : "s"} ({totalItems} item
            {totalItems === 1 ? "" : "s"})
          </span>
          <span>{formatPrice(totalCents, currency, "en")}</span>
        </div>
        <div className="mt-1 flex justify-between font-semibold text-foreground">
          <span>Total</span>
          <span>{formatPrice(totalCents, currency, "en")}</span>
        </div>
      </div>
    </div>
  );
}
