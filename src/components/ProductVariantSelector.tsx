"use client";

import { useTranslations, useLocale } from "next-intl";
import { AddToCartButton } from "./AddToCartButton";
import { formatPrice } from "@/lib/format";
import type { ProductDetail, ProductVariant } from "@/lib/products";

/**
 * Renders one <select> per option type (e.g. Size, Skin type) and resolves
 * the current selections to the single product_variants row that matches
 * the exact combination -- full combination pricing, not "cheapest/priciest
 * selected option wins". Selection state is owned by the parent
 * (ProductDetailProvider in ProductDetailInteractive.tsx) rather than
 * locally, so the PDP's Additional Information tab can show the same
 * selected variant's weight/dimensions.
 */
export function ProductVariantSelector({
  product,
  selections,
  onSelect,
  matchedVariant,
}: {
  product: ProductDetail;
  selections: Record<string, string>;
  onSelect: (typeId: string, valueId: string) => void;
  matchedVariant: ProductVariant | undefined;
}) {
  const t = useTranslations("variantSelector");
  const locale = useLocale();
  const sortedTypes = [...product.product_option_types].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div>
      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-2xl font-bold text-foreground">
          {formatPrice(
            matchedVariant ? matchedVariant.price_cents : product.price_cents,
            product.currency,
            locale
          )}
        </span>
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
                onChange={(e) => onSelect(type.id, e.target.value)}
                className="border border-line bg-transparent px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  {t("selectOption", { option: type.name.toLowerCase() })}
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
              }
            : undefined
        }
      />
    </div>
  );
}

/**
 * Resolves the default selections (first sorted value per option type) --
 * shared by ProductDetailProvider so the price/variant shown on first
 * render matches what the dropdowns visually display, instead of an empty
 * placeholder state that silently blocked Add to Cart until every dropdown
 * was manually touched.
 */
export function defaultSelections(product: ProductDetail): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const type of product.product_option_types) {
    const firstValue = [...type.product_option_values].sort(
      (a, b) => a.sort_order - b.sort_order
    )[0];
    if (firstValue) initial[type.id] = firstValue.id;
  }
  return initial;
}
