"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import type { ProductDetail } from "@/lib/products";

export function AddToCartButton({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const inStock = product.stock_qty > 0;
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: product.price_cents,
      currency: product.currency,
      imageUrl: image?.url ?? null,
      quantity: 1,
      stockQty: product.stock_qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      <button
        onClick={handleAdd}
        disabled={!inStock}
        className="mt-8 w-full bg-foreground px-6 py-4 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-100"
      >
        {!inStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
      </button>
      <p className="mt-2 text-xs text-muted">
        {inStock ? (
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
