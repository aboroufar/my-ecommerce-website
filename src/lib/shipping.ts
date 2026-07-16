export function calculateShippingCents(
  subtotalCents: number,
  flatRateCents: number,
  freeThresholdCents: number
): number {
  return subtotalCents >= freeThresholdCents ? 0 : flatRateCents;
}
