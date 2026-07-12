"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import type { ProductDetail } from "@/lib/products";

interface VariantOverride {
  variantId: string;
  variantLabel: string;
  priceCents: number;
  stockQty: number;
}

export function AddToCartButton({
  product,
  variant,
  disabled,
}: {
  product: ProductDetail;
  // When the product has options, the PDP passes the currently-selected
  // variant's price/stock/id here so the cart line reflects the exact
  // combination chosen -- undefined until a full valid selection is made.
  variant?: VariantOverride;
  // True when the product has options but the shopper hasn't finished
  // selecting one value per option type yet.
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const effectiveStock = variant?.stockQty ?? product.stock_qty;
  const inStock = effectiveStock > 0;
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: variant?.priceCents ?? product.price_cents,
      currency: product.currency,
      imageUrl: image?.url ?? null,
      quantity: 1,
      stockQty: effectiveStock,
      variantId: variant?.variantId,
      variantLabel: variant?.variantLabel,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const isDisabled = disabled || !inStock;

  return (
    <div>
      <button
        onClick={handleAdd}
        disabled={isDisabled}
        className="mt-8 w-full bg-foreground px-6 py-4 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-100"
      >
        {disabled
          ? "Select options"
          : !inStock
            ? "Out of stock"
            : added
              ? "Added ✓"
              : "Add to cart"}
      </button>
      <p className="mt-2 text-xs text-muted">
        {disabled ? (
          "Choose an option for every dropdown above to continue."
        ) : inStock ? (
          <>
            Ships in 2–3 business days.{" "}
            <Link href="/shipping" className="underline underline-offset-4 hover:text-foreground">
              Shipping details
            </Link>
          </>
        ) : (
          "Check back soon — this item is currently unavailable."
        )}
      </p>
    </div>
  );
}
