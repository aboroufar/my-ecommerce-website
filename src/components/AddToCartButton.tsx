"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import type { ProductDetail } from "@/lib/products";

const MAX_QUANTITY = 99;

interface VariantOverride {
  variantId: string;
  variantLabel: string;
  priceCents: number;
}

export function AddToCartButton({
  product,
  variant,
  disabled,
}: {
  product: ProductDetail;
  // When the product has options, the PDP passes the currently-selected
  // variant's price/id here so the cart line reflects the exact
  // combination chosen -- undefined until a full valid selection is made.
  variant?: VariantOverride;
  // True when the product has options but the shopper hasn't finished
  // selecting one value per option type yet.
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: variant?.priceCents ?? product.price_cents,
      // A variant's own price isn't necessarily comparable to the parent
      // product's compare-at price, so only show a "was" price when the
      // shopper is buying the base product (no variant override).
      compareAtPriceCents: variant ? null : product.compare_at_price_cents,
      currency: product.currency,
      imageUrl: image?.url ?? null,
      quantity,
      variantId: variant?.variantId,
      variantLabel: variant?.variantLabel,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      <div className="mt-8 flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-full w-10 items-center justify-center text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="w-10 text-center text-sm text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            disabled={quantity >= MAX_QUANTITY}
            aria-label="Increase quantity"
            className="flex h-full w-10 items-center justify-center text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={disabled}
          className="flex-1 rounded-full bg-foreground px-6 py-4 text-sm font-medium uppercase tracking-wide text-background transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-100 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {disabled ? "Select options" : added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {disabled ? (
          "Choose an option for every dropdown above to continue."
        ) : (
          <>
            Ships in 2–3 business days.{" "}
            <Link href="/shipping" className="underline underline-offset-4 hover:text-foreground">
              Shipping details
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
