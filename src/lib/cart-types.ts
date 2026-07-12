export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  priceCents: number; // display only -- server re-validates against DB at checkout
  currency: string;
  imageUrl: string | null;
  quantity: number;
  // Stock is intentionally never shown to the customer or capped
  // client-side -- the real check happens server-side in /api/checkout,
  // which re-fetches stock_qty and rejects the order at checkout time if
  // it's no longer sufficient.
  // Set only for products with options -- identifies the exact
  // product_variants row (e.g. "Small/Oily") so two different variants of
  // the same product don't collapse into one cart line. variantLabel is
  // just the human-readable display string ("Size: Small, Skin type:
  // Oily"); priceCents/stockQty above already reflect the variant's own
  // values when this is set, not the parent product's.
  variantId?: string;
  variantLabel?: string;
}

/**
 * Cart line identity: two entries are "the same line" only if both the
 * product AND the variant (or lack thereof) match -- so adding "Small" and
 * then "Large" of the same product results in two separate lines instead
 * of one being merged/incremented into the other.
 */
export function cartLineKey(item: { productId: string; variantId?: string }): string {
  return `${item.productId}::${item.variantId ?? ""}`;
}
