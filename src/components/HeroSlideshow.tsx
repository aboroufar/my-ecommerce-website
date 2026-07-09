"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/products";

/**
 * Stock placeholder art (Unsplash, free-to-use) shown until a category has
 * a real product photo to use as its hero background. Distinct pool from
 * CategoryGrid's so the two sections don't repeat the same images.
 */
const placeholderImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=80",
];

const captionsBySlug: Record<string, string> = {
  accessories:
    "The small details that finish a look — bags, hats, and everyday carry.",
  apparel: "Wardrobe staples made to be worn, washed, and worn again.",
};

const SLIDE_DURATION_MS = 6000;

export function HeroSlideshow({ categories }: { categories: Category[] }) {
  const slides = categories.map((category, i) => ({
    category,
    image: placeholderImages[i % placeholderImages.length],
    caption:
      captionsBySlug[category.slug] ??
      `Explore what's new in ${category.name}.`,
  }));

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return <section className="relative flex min-h-[60vh] items-center bg-surface" />;
  }

  function goTo(i: number) {
    setActive((i + slides.length) % slides.length);
  }

  return (
    <section className="relative flex min-h-[60vh] items-center overflow-hidden">
      {slides.map((slide, i) => (
        <Image
          key={slide.category.id}
          src={slide.image}
          alt={slide.category.name}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/20 to-transparent" />

      <div className="relative max-w-3xl px-6 text-background sm:px-16">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] sm:text-sm">
          Everything you may know
        </span>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
          {slides[active].caption}
        </h1>
        <Link
          href={`/products?category=${slides[active].category.slug}`}
          className="mt-8 inline-block rounded-full border border-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-background hover:text-foreground"
        >
          Read more
        </Link>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(active - 1)}
            className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-background transition-opacity hover:opacity-70 sm:left-8"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(active + 1)}
            className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-background transition-opacity hover:opacity-70 sm:right-8"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}
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
