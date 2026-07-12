"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getReviewSummary, type ProductSummary } from "@/lib/products";
import { formatPrice, getSaleInfo } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { StarRating } from "./StarRating";

export function ProductCard({ product }: { product: ProductSummary }) {
  const { addItem } = useCart();
  const router = useRouter();
  const wishlist = useWishlist();
  const [pending, setPending] = useState(false);
  const wishlisted = wishlist.ids.has(product.id);
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const categoryName = product.product_categories[0]?.categories?.name;
  const sale = getSaleInfo(product.price_cents, product.compare_at_price_cents);
  const { count, average } = getReviewSummary(product.product_reviews);

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
    });
  }

  async function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await wishlist.toggle(product.id);
    setPending(false);
    if (!result.signedIn) {
      router.push("/account");
    }
  }

  return (
    <div className="group relative">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors ${
            wishlisted
              ? "bg-accent text-background"
              : "bg-background text-foreground hover:bg-accent hover:text-background"
          }`}
        >
          <HeartIcon filled={wishlisted} />
        </button>
        <Link
          href={`/products/${product.slug}`}
          aria-label="Quick view"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-background"
        >
          <SearchIcon />
        </Link>
        <Link
          href="/account"
          aria-label="Compare"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-background"
        >
          <CompareIcon />
        </Link>
      </div>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface">
          {(sale.onSale || product.is_popular) && (
            <div className="absolute left-3 top-3 z-10 flex gap-1.5">
              {sale.onSale && (
                <span className="rounded-full bg-sale px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                  Sale
                </span>
              )}
              {product.is_popular && (
                <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                  Popular
                </span>
              )}
            </div>
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

          {count > 0 && (
            <div className="mt-1">
              <StarRating rating={average} />
            </div>
          )}

          {product.description && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
              {product.description}
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M7 3v14M7 17 4 14M7 17l3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 21V7M17 7l3 3M17 7l-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
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
