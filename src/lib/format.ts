// Maps next-intl's short locale codes to the full BCP-47 tag Intl needs for
// sensible region-aware formatting (grouping separators, currency symbol
// placement, etc).
const INTL_LOCALE: Record<string, string> = {
  en: "en-US",
  it: "it-IT",
};

export function formatPrice(cents: number, currency = "eur", locale = "it") {
  return new Intl.NumberFormat(INTL_LOCALE[locale] ?? locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDate(
  date: string | number | Date,
  locale = "it",
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? locale, options).format(
    new Date(date)
  );
}

/**
 * A product is "on sale" only when compare_at_price_cents is set AND
 * strictly greater than price_cents -- a compare-at price equal to or
 * below the current price isn't a real discount, so don't show one.
 */
export function getSaleInfo(
  priceCents: number,
  compareAtPriceCents: number | null
): { onSale: false } | { onSale: true; percentOff: number } {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) {
    return { onSale: false };
  }
  const percentOff = Math.round(
    ((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100
  );
  return { onSale: true, percentOff };
}
