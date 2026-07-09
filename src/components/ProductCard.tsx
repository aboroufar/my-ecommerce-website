"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductSummary } from "@/lib/products";
import { formatPrice, getSaleInfo } from "@/lib/format";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: ProductSummary }) {
  const { addItem } = useCart();
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const categoryName = product.product_categories[0]?.categories?.name;
  const sale = getSaleInfo(product.price_cents, product.compare_at_price_cents);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
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
  }

  return (
    <div className="group relative">
      <Link
        href="/account"
        aria-label="Add to wishlist"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-background"
      >
        <HeartIcon />
      </Link>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface">
          {sale.onSale && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-sale px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
              Sale
            </span>
          )}
          {image ? (
            <Image
              src={image.url}
              alt={image.alt_text ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-2xl text-accent/40">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          {categoryName && (
            <span className="text-xs text-muted">{categoryName}</span>
          )}
          <h3 className="mt-1 font-display text-lg font-bold text-foreground">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          {product.stock_qty > 0 && product.stock_qty <= 10 && (
            <p className="mt-2 text-xs font-medium text-accent">
              Only {product.stock_qty} left
            </p>
          )}
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-accent text-accent transition-colors hover:bg-accent hover:text-background"
        >
          <CartPlusIcon />
        </button>
        <span className="flex items-baseline gap-2">
          {sale.onSale && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.compare_at_price_cents!, product.currency)}
            </span>
          )}
          <span className="text-sm font-bold text-foreground">
            {formatPrice(product.price_cents, product.currency)}
          </span>
        </span>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <path
        d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 6.7C19 15.6 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path
        d="M2 3h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L20 7H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 9h4M17 7v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
