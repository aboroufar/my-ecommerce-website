export function formatPrice(cents: number, currency = "eur") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
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
