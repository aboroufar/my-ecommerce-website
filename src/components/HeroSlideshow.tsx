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
    return (
      <section className="relative flex min-h-[60vh] items-center bg-surface px-6 py-20 sm:px-16" />
    );
  }

  return (
    <section className="relative flex min-h-[60vh] items-end overflow-hidden px-6 py-16 sm:px-16">
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
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

      <div className="relative max-w-xl text-background">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {slides[active].category.name}
        </span>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
          {slides[active].caption}
        </h1>
        <Link
          href={`/products?category=${slides[active].category.slug}`}
          className="mt-6 inline-block text-sm font-semibold uppercase tracking-wide underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          Read more
        </Link>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 right-6 flex gap-2 sm:right-16">
          {slides.map((slide, i) => (
            <button
              key={slide.category.id}
              type="button"
              aria-label={`Show ${slide.category.name} slide`}
              onClick={() => setActive(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === active ? "bg-accent" : "bg-background/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
