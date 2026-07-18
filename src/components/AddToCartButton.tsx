"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("addToCartButton");
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
        <div className="flex items-center overflow-hidden rounded-full border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label={t("decreaseQuantity")}
            className="flex h-full w-10 items-center justify-center text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            −
          </button>
          <span className="w-10 text-center text-sm text-foreground" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            disabled={quantity >= MAX_QUANTITY}
            aria-label={t("increaseQuantity")}
            className="flex h-full w-10 items-center justify-center text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={disabled}
          aria-live="polite"
          className="flex-1 rounded-full bg-foreground px-6 py-4 text-sm font-medium uppercase tracking-wide text-background transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-100 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {disabled ? t("selectOptions") : added ? t("added") : t("addToCart")}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {disabled ? (
          t("chooseOption")
        ) : (
          <>
            {t("shipsIn")}{" "}
            <Link href="/shipping" className="underline underline-offset-4 hover:text-foreground">
              {t("shippingDetails")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
