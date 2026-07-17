"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PriceRangeFilter({
  minPrice,
  maxPrice,
}: {
  minPrice?: string;
  maxPrice?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(minPrice ?? "");
  const [max, setMax] = useState(maxPrice ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (min.trim()) params.set("minPrice", min.trim());
    else params.delete("minPrice");
    if (max.trim()) params.set("maxPrice", max.trim());
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <h2 className="font-display text-base font-bold text-foreground">Price</h2>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Minimum price</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            className="w-full border border-line bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
          />
        </label>
        <span className="text-muted">–</span>
        <label className="flex-1">
          <span className="sr-only">Maximum price</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            className="w-full border border-line bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-3 w-full border border-line px-3 py-2 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
      >
        Apply
      </button>
    </form>
  );
}
