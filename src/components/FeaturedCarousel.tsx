"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductSummary } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export function FeaturedCarousel({ products }: { products: ProductSummary[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            What&apos;s new
          </span>
          <h2 className="mt-2 font-display text-5xl font-bold leading-none text-foreground">
            Featured
          </h2>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/products"
            className="text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
          >
            View all
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll featured products left"
              className="flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-60"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll featured products right"
              className="flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-60"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <div
          ref={scrollerRef}
          className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <FeaturedCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">
          No products yet — add some via /admin.
        </p>
      )}

      <Link
        href="/products"
        className="mt-6 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4 sm:hidden"
      >
        View all
      </Link>
    </section>
  );
}

function FeaturedCard({ product }: { product: ProductSummary }) {
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block w-[calc(50%-12px)] shrink-0 snap-start sm:w-[calc(25%-18px)]"
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
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
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-foreground">
          {formatPrice(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
    >
      <path
        d={direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
