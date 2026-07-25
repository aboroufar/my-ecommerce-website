"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { AddProductsModal } from "./AddProductsModal";
import type { ProductSearchOption } from "./PurchaseOrderLineItems";

interface DraftLineItem {
  key: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  unit_price_cents: number;
  quantity: number;
}

/**
 * Draft-order line-item builder -- same search-and-add-then-edit shape
 * as PurchaseOrderLineItems (reusing the same AddProductsModal), but
 * unlike a purchase order's supplier cost, unit price here is always
 * the server-fetched canonical price from `options` and is never an
 * editable input: only quantity is. Editing a customer-facing price by
 * hand would violate the "never trust/allow a manually-entered price"
 * rule that governs checkout and every other order-creation path in
 * this app -- createDraftOrder re-fetches price server-side regardless,
 * so a tampered lines_json couldn't change it anyway, but the UI
 * shouldn't even suggest it's possible.
 */
export function DraftOrderLineItems({
  options,
  currency,
  onSubtotalChange,
}: {
  options: ProductSearchOption[];
  currency: string;
  onSubtotalChange?: (subtotalCents: number) => void;
}) {
  const [items, setItems] = useState<DraftLineItem[]>([]);

  const priceByKey = new Map(
    options.map((o) => [`${o.productId}:${o.variantId ?? ""}`, o.priceCents])
  );
  const stockByKey = new Map(
    options.map((o) => [`${o.productId}:${o.variantId ?? ""}`, o.stockQty])
  );

  function addItems(selected: ProductSearchOption[]) {
    setItems((prev) => {
      const existingKeys = new Set(prev.map((i) => i.key));
      const additions = selected
        .filter((option) => !existingKeys.has(`${option.productId}:${option.variantId ?? ""}`))
        .map((option) => {
          const key = `${option.productId}:${option.variantId ?? ""}`;
          return {
            key,
            product_id: option.productId,
            variant_id: option.variantId,
            product_name: option.productName,
            variant_label: option.variantLabel,
            unit_price_cents: priceByKey.get(key) ?? 0,
            quantity: 1,
          };
        });
      return [...prev, ...additions];
    });
  }

  function updateQuantity(key: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);
  const addedKeys = new Set(items.map((i) => i.key));

  useEffect(() => {
    onSubtotalChange?.(subtotalCents);
  }, [subtotalCents, onSubtotalChange]);

  const overstockedItems = items.filter((item) => {
    const stockQty = stockByKey.get(item.key);
    return stockQty !== undefined && item.quantity > stockQty;
  });

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name="lines_json"
        value={JSON.stringify(
          items.map((item) => ({
            productId: item.product_id,
            variantId: item.variant_id ?? undefined,
            quantity: item.quantity,
          }))
        )}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {items.length === 0 ? "No products added yet." : `${items.length} product${items.length === 1 ? "" : "s"}`}
        </span>
        <AddProductsModal options={options} alreadyAddedKeys={addedKeys} onAdd={addItems} />
      </div>

      {overstockedItems.map((item) => {
        const stockQty = stockByKey.get(item.key) ?? 0;
        return (
          <p
            key={item.key}
            className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            {item.product_name}
            {item.variant_label && ` — ${item.variant_label}`} has {stockQty} unit
            {stockQty === 1 ? "" : "s"} in stock.
          </p>
        );
      })}

      {items.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Product</th>
              <th className="w-24 py-2 font-medium">Qty</th>
              <th className="w-28 py-2 font-medium">Price</th>
              <th className="w-28 py-2 text-right font-medium">Total</th>
              <th className="w-8 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.key}>
                <td className="py-2 text-foreground">
                  {item.product_name}
                  {item.variant_label && <span className="text-muted"> — {item.variant_label}</span>}
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.key, Number(e.target.value) || 1)}
                    className="w-16 border border-line bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2 text-muted">{formatPrice(item.unit_price_cents, currency, "en")}</td>
                <td className="py-2 text-right text-foreground">
                  {formatPrice(item.unit_price_cents * item.quantity, currency, "en")}
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
    </div>
  );
}
