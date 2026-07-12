"use client";

import { useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { formatPrice } from "@/lib/format";
import {
  findMatchingVariant,
  getVariantPriceRange,
  type ProductDetail,
} from "@/lib/products";

/**
 * Renders one <select> per option type (e.g. Size, Skin type), tracks the
 * shopper's selections, and resolves them to the single product_variants
 * row that matches the exact combination -- full combination pricing, not
 * "cheapest/priciest selected option wins". Shows a price range until
 * every option type has a selection, then the matched variant's own price
 * and stock message. Wraps AddToCartButton, passing down the resolved
 * variant (or leaving it disabled until the selection is complete).
 */
export function ProductVariantSelector({ product }: { product: ProductDetail }) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  if (product.product_option_types.length === 0) {
    return <AddToCartButton product={product} />;
  }

  const sortedTypes = [...product.product_option_types].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const matchedVariant = findMatchingVariant(product, selections);
  const { min, max } = getVariantPriceRange(product);

  return (
    <div>
      <div className="mt-4 flex items-baseline gap-3">
        {matchedVariant ? (
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(matchedVariant.price_cents, product.currency)}
          </span>
        ) : (
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(min, product.currency)}
            {max !== min && <>–{formatPrice(max, product.currency)}</>}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {sortedTypes.map((type) => {
          const sortedValues = [...type.product_option_values].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          return (
            <label key={type.id} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                {type.name}
              </span>
              <select
                value={selections[type.id] ?? ""}
                onChange={(e) =>
                  setSelections((prev) => ({ ...prev, [type.id]: e.target.value }))
                }
                className="border border-line bg-transparent px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select {type.name.toLowerCase()}
                </option>
                {sortedValues.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>

      {matchedVariant && (
        <p className="mt-3 text-sm font-medium text-foreground">
          {matchedVariant.stock_qty <= 0
            ? "Out of stock"
            : matchedVariant.stock_qty <= 10
              ? `Only ${matchedVariant.stock_qty} left in stock`
              : "In stock"}
        </p>
      )}

      <AddToCartButton
        product={product}
        disabled={!matchedVariant}
        variant={
          matchedVariant
            ? {
                variantId: matchedVariant.id,
                variantLabel: sortedTypes
                  .map((type) => {
                    const valueId = selections[type.id];
                    const value = type.product_option_values.find(
                      (v) => v.id === valueId
                    );
                    return value ? `${type.name}: ${value.label}` : null;
                  })
                  .filter(Boolean)
                  .join(", "),
                priceCents: matchedVariant.price_cents,
                stockQty: matchedVariant.stock_qty,
              }
            : undefined
        }
      />
    </div>
  );
}
