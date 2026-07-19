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
    <section className="relative flex min-h-[31rem] items-center overflow-hidden sm:min-h-[34rem] lg:min-h-[38rem]">
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
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/45 to-transparent" />

      <div className="relative max-w-3xl px-6 text-background sm:px-12 lg:px-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-background/75">Thoughtful everyday essentials</p>
        <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
          {current.headline}
        </h1>
        {current.description && (
          <p className="mt-4 max-w-xl text-base text-background/85 sm:text-lg">
            {current.description}
          </p>
        )}
        <Link
          href={current.link_url}
          className="mt-8 inline-block rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:bg-background/90 hover:shadow-md"
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
            className="absolute bottom-6 left-6 flex h-10 w-10 items-center justify-center rounded-full border border-background/40 bg-foreground/15 text-background transition-colors hover:bg-background hover:text-foreground sm:bottom-auto sm:left-8 sm:top-1/2 sm:-translate-y-1/2"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label={t("nextSlide")}
            onClick={() => goTo(active + 1)}
            className="absolute bottom-6 left-20 flex h-10 w-10 items-center justify-center rounded-full border border-background/40 bg-foreground/15 text-background transition-colors hover:bg-background hover:text-foreground sm:bottom-auto sm:left-auto sm:right-8 sm:top-1/2 sm:-translate-y-1/2"
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
