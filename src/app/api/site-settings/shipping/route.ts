import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({
    shippingFlatRateCents: settings.shipping_flat_rate_cents,
    freeShippingThresholdCents: settings.free_shipping_threshold_cents,
    deliveryEstimateEnabled: settings.delivery_estimate_enabled,
    fulfillmentTimeDays: settings.fulfillment_time_days,
    transitTimeMinDays: settings.transit_time_min_days,
    transitTimeMaxDays: settings.transit_time_max_days,
  });
}
