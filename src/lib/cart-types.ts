export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  priceCents: number; // display only -- server re-validates against DB at checkout
  currency: string;
  imageUrl: string | null;
  quantity: number;
}
