export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  priceCents: number; // display only -- server re-validates against DB at checkout
  currency: string;
  imageUrl: string | null;
  quantity: number;
  // Snapshot of stock_qty at the moment this was added -- used only to cap
  // the quantity stepper in the cart UI. Like priceCents, this can go stale
  // (someone else buys remaining stock later); the real check happens
  // server-side in /api/checkout, which re-fetches stock_qty and rejects
  // the order if it's no longer sufficient.
  stockQty: number;
}
