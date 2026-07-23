"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { AddProductsModal } from "./AddProductsModal";

export interface ProductSearchOption {
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  sku: string | null;
  imageUrl: string | null;
  stockQty: number;
}

export interface LineItem {
  key: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  supplier_sku: string;
  quantity_ordered: number;
  unit_cost_cents: number;
  discount_percent: number;
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

  function addItems(selected: ProductSearchOption[]) {
    setItems((prev) => {
      const existingKeys = new Set(prev.map((i) => i.key));
      const additions = selected
        .filter((option) => !existingKeys.has(`${option.productId}:${option.variantId ?? ""}`))
        .map((option) => ({
          key: `${option.productId}:${option.variantId ?? ""}`,
          product_id: option.productId,
          variant_id: option.variantId,
          product_name: option.productName,
          variant_label: option.variantLabel,
          supplier_sku: "",
          quantity_ordered: 1,
          unit_cost_cents: 0,
          discount_percent: 0,
        }));
      return [...prev, ...additions];
    });
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  // The %-off box discounts the entered unit cost -- the line total (and
  // the value actually saved as unit_cost_cents) reflects the discounted
  // price, not the pre-discount one, matching the screenshot's Total
  // column reacting to both the cost and % fields.
  function effectiveUnitCostCents(item: LineItem) {
    return Math.round(item.unit_cost_cents * (1 - item.discount_percent / 100));
  }

  const totalCents = items.reduce(
    (sum, i) => sum + i.quantity_ordered * effectiveUnitCostCents(i),
    0
  );
  const totalVariants = items.length;
  const totalItems = items.reduce((sum, i) => sum + i.quantity_ordered, 0);
  const addedKeys = new Set(items.map((i) => i.key));

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_label: item.variant_label,
            supplier_sku: item.supplier_sku,
            quantity_ordered: item.quantity_ordered,
            unit_cost_cents: effectiveUnitCostCents(item),
          }))
        )}
      />

      <AddProductsModal options={options} alreadyAddedKeys={addedKeys} onAdd={addItems} />

      {items.length === 0 ? (
        <p className="text-sm text-muted">No products added yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Product</th>
              <th className="w-32 py-2 font-medium">Supplier SKU</th>
              <th className="w-20 py-2 font-medium">Qty</th>
              <th className="w-44 py-2 font-medium">Cost</th>
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
                    value={item.supplier_sku}
                    onChange={(e) => updateItem(item.key, { supplier_sku: e.target.value })}
                    className="w-full border border-line bg-background px-2 py-1 text-sm"
                  />
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
                    className="w-16 border border-line bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
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
                      className="w-20 border border-line bg-background px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discount_percent}
                      onChange={(e) =>
                        updateItem(item.key, {
                          discount_percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      title="Discount %"
                      className="w-14 border border-line bg-background px-2 py-1 text-sm"
                    />
                    <span className="flex items-center text-muted">%</span>
                  </div>
                </td>
                <td className="py-2 text-right text-foreground">
                  {formatPrice(item.quantity_ordered * effectiveUnitCostCents(item), currency, "en")}
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
