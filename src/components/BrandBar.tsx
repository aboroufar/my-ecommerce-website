"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Brand } from "@/lib/brands";

const SCROLL_STEP_PX = 400;

/**
 * Renders admin-managed brand/partner logos as a plain, manually-scrollable
 * strip (douglas.it-style: flat wordmark tiles, no card chrome, no name
 * label, no auto-playing marquee) rather than a looping carousel. Unlike
 * CategoryGrid, there's no placeholder fallback -- a brand logo is
 * inherently a real-world claim ("we carry this brand"), so this section
 * simply doesn't render until at least one real brand exists.
 */
export function BrandBar({ brands }: { brands: Brand[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (brands.length === 0) return null;

  function scrollBy(direction: 1 | -1) {
    trackRef.current?.scrollBy({
      left: direction * SCROLL_STEP_PX,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative border-y border-line bg-background py-4">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll brands left"
          className="hidden shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground sm:flex"
        >
          <ChevronIcon direction="left" />
        </button>

        <div
          ref={trackRef}
          className="flex flex-1 items-center gap-10 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brands.map((brand) => {
            const content = (
              <div className="relative h-9 w-20 shrink-0 grayscale transition-[filter] duration-200 hover:grayscale-0">
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
            );

            return brand.link_url ? (
              <Link
                key={brand.id}
                href={brand.link_url}
                aria-label={brand.name}
                className="shrink-0"
              >
                {content}
              </Link>
            ) : (
              <div key={brand.id} aria-label={brand.name} className="shrink-0">
                {content}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll brands right"
          className="hidden shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground sm:flex"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </section>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path
        d={direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
