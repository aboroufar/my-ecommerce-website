"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { HeroSlide } from "@/lib/heroSlides";

const SLIDE_DURATION_MS = 6000;

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const t = useTranslations("heroSlideshow");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return <section className="relative flex aspect-[7/3] items-center bg-surface" />;
  }

  function goTo(i: number) {
    setActive((i + slides.length) % slides.length);
  }

  const current = slides[active];

  return (
    <section className="relative flex aspect-[7/3] items-center overflow-hidden">
      {slides.map((slide, i) => (
        <Image
          key={slide.id}
          src={slide.image_url}
          alt={slide.headline}
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
        <h1 className="font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
          {current.headline}
        </h1>
        {current.description && (
          <p className="mt-4 max-w-xl text-base text-background/85 sm:text-lg">
            {current.description}
          </p>
        )}
        <Link
          href={current.link_url}
          className="mt-8 inline-block rounded-full border border-background px-6 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:bg-background hover:text-foreground hover:shadow-md"
        >
          {t("readMore")}
        </Link>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t("previousSlide")}
            onClick={() => goTo(active - 1)}
            className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-background transition-opacity hover:opacity-70 sm:left-8"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label={t("nextSlide")}
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
