export interface DeliveryEstimateSettings {
  delivery_estimate_enabled: boolean;
  fulfillment_time_days: number;
  transit_time_min_days: number;
  transit_time_max_days: number;
}

/** Advances a date by n business days (skips Sat/Sun), matching Shopify's own "business days" semantics for this setting. */
function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

/**
 * Computes the [earliest, latest] delivery date range from today, given
 * fulfillment_time_days (processing before it ships) + a transit day
 * range (carrier transit once shipped). Returns null when the estimate
 * isn't enabled -- callers should render nothing in that case, not a
 * fallback string, so a store that hasn't configured this doesn't show
 * a made-up date.
 */
export function computeDeliveryEstimate(
  settings: DeliveryEstimateSettings,
  now: Date = new Date()
): { earliest: Date; latest: Date } | null {
  if (!settings.delivery_estimate_enabled) return null;

  const shipDate = addBusinessDays(now, settings.fulfillment_time_days);
  const earliest = addBusinessDays(shipDate, settings.transit_time_min_days);
  const latest = addBusinessDays(shipDate, settings.transit_time_max_days);
  return { earliest, latest };
}
