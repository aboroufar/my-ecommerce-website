"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";

/**
 * Single-handle "price up to X" slider (not a true min/max range -- one
 * handle, one bound), matching the reference design's Select Price control.
 * The bound is a maxPrice searchParam; navigation happens on release
 * (mouseup/touchend) rather than on every drag tick, so it doesn't spam
 * the router mid-drag.
 */
export function PriceRangeSlider({
  maxPriceCents,
  currentMaxPrice,
}: {
  // Upper bound of the slider's own range, in cents -- the highest price
  // among active products, so the control's scale matches the real catalog.
  maxPriceCents: number;
  // The currently-applied maxPrice filter (major units, e.g. "50"), if any.
  currentMaxPrice?: string;
}) {
  const t = useTranslations("shopSidebar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const maxMajor = maxPriceCents / 100;
  const [value, setValue] = useState(() =>
    currentMaxPrice ? Number(currentMaxPrice) : maxMajor
  );

  if (maxPriceCents <= 0) return null;

  const percent = maxMajor > 0 ? (value / maxMajor) * 100 : 0;

  function commit(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next >= maxMajor) params.delete("maxPrice");
    else params.set("maxPrice", String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-8">
      <h2 className="font-display text-base font-bold text-foreground">{t("selectPrice")}</h2>
      <div className="relative mt-6 px-1">
        <div
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs font-medium text-background"
          style={{ left: `${percent}%` }}
        >
          {formatPrice(Math.round(value * 100), "eur", locale)}
        </div>
        <input
          type="range"
          min={0}
          max={maxMajor}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={(e) => commit(Number(e.currentTarget.value))}
          onTouchEnd={(e) => commit(Number(e.currentTarget.value))}
          onKeyUp={(e) => commit(Number(e.currentTarget.value))}
          className="range-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percent}%, var(--line) ${percent}%, var(--line) 100%)`,
          }}
          aria-label={t("selectPrice")}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{t("minimum")}</span>
          <span>{t("maximum")}</span>
        </div>
      </div>
    </div>
  );
}
