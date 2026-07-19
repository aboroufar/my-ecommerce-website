"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { getReviewSummary, type ProductSummary } from "@/lib/products";
import { formatPrice, getSaleInfo } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { StarRating } from "./StarRating";

export function ProductCard({ product }: { product: ProductSummary }) {
  const t = useTranslations("productCard");
  const locale = useLocale();
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
      compareAtPriceCents: product.compare_at_price_cents,
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
    <div className="group relative rounded-2xl bg-surface p-2 transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(32,30,28,0.10)]">
      <div className="absolute right-5 top-5 z-10 flex flex-col gap-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
          aria-pressed={wishlisted}
          className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            wishlisted
              ? "bg-accent text-background"
              : "bg-background text-foreground hover:bg-accent hover:text-background"
          }`}
        >
          <HeartIcon filled={wishlisted} />
        </button>
        <Link
          href={`/products/${product.slug}`}
          aria-label={t("quickView")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <SearchIcon />
        </Link>
        <Link
          href="/account"
          aria-label={t("signInToSave")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <CompareIcon />
        </Link>
      </div>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-accent-soft">
          {(sale.onSale || product.is_popular) && (
            <div className="absolute left-3 top-3 z-10 flex gap-1.5">
              {sale.onSale && (
                <span className="rounded-full bg-sale px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                  {t("sale")}
                </span>
              )}
              {product.is_popular && (
                <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                  {t("popular")}
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
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-2xl text-accent/40">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="px-2 pb-1 pt-4">
          {categoryName && (
            <span className="text-xs text-muted">{categoryName}</span>
          )}
          <h3 className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">
            {product.name}
          </h3>

          {count > 0 && (
            <div className="mt-1">
              <StarRating rating={average} />
            </div>
          )}

          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}
        </div>
      </Link>

      <div className="mx-2 mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={t("addToCart", { name: product.name })}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <CartPlusIcon />
        </button>
        <span className="flex items-baseline gap-2">
          {sale.onSale && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.compare_at_price_cents!, product.currency, locale)}
            </span>
          )}
          <span className="text-sm font-bold text-foreground">
            {formatPrice(product.price_cents, product.currency, locale)}
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
