"use client";

import { createContext, useContext, useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { ProductVariantSelector, defaultSelections } from "./ProductVariantSelector";
import { findMatchingVariant, type ProductDetail, type ProductVariant } from "@/lib/products";

/**
 * Selection state + the resolved matched variant, shared via context
 * because the price/selector block (right column of the grid) and the
 * Additional Information tab (full-width, below the grid) are siblings in
 * the page's DOM structure -- neither is an ancestor of the other, so prop
 * drilling can't connect them, but both need to know which variant (and
 * thus which weight/dimensions) is currently selected.
 */
interface ProductDetailState {
  product: ProductDetail;
  selections: Record<string, string>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  matchedVariant: ProductVariant | undefined;
}

const ProductDetailContext = createContext<ProductDetailState | null>(null);

function useProductDetail(): ProductDetailState {
  const ctx = useContext(ProductDetailContext);
  if (!ctx) throw new Error("Must be used within ProductDetailProvider");
  return ctx;
}

export function ProductDetailProvider({
  product,
  children,
}: {
  product: ProductDetail;
  children: React.ReactNode;
}) {
  const hasOptions = product.product_option_types.length > 0;
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    hasOptions ? defaultSelections(product) : {}
  );
  const matchedVariant = hasOptions
    ? findMatchingVariant(product, selections)
    : undefined;

  return (
    <ProductDetailContext.Provider
      value={{ product, selections, setSelections, matchedVariant }}
    >
      {children}
    </ProductDetailContext.Provider>
  );
}

/** Option dropdowns + Add to Cart (or a plain Add to Cart when the product has no options). */
export function ProductAddToCart() {
  const { product, selections, setSelections, matchedVariant } = useProductDetail();

  if (product.product_option_types.length === 0) {
    return <AddToCartButton product={product} />;
  }

  return (
    <ProductVariantSelector
      product={product}
      selections={selections}
      onSelect={(typeId, valueId) =>
        setSelections((prev) => ({ ...prev, [typeId]: valueId }))
      }
      matchedVariant={matchedVariant}
    />
  );
}

/** "Additional information" tab content -- weight/dimensions of the currently-selected variant. */
export function SelectedVariantInfo() {
  const { product, matchedVariant } = useProductDetail();
  const weightText = matchedVariant?.weight_text ?? product.weight_text;
  const dimensionsText = matchedVariant?.dimensions_text ?? product.dimensions_text;

  if (!weightText && !dimensionsText) {
    return <p>No additional information yet.</p>;
  }

  return (
    <table className="text-sm">
      <tbody>
        {weightText && (
          <tr>
            <td className="py-1 pr-8 font-medium text-foreground">Weight</td>
            <td className="py-1">{weightText}</td>
          </tr>
        )}
        {dimensionsText && (
          <tr>
            <td className="py-1 pr-8 font-medium text-foreground">Dimensions</td>
            <td className="py-1">{dimensionsText}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
