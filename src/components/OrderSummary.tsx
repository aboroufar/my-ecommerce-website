import { formatPrice } from "@/lib/format";

export function OrderSummary({
  subtotalCents,
  discountCents,
  discountCode,
  currency,
}: {
  subtotalCents: number;
  discountCents: number;
  discountCode: string | null;
  currency: string;
}) {
  const totalCents = Math.max(0, subtotalCents - discountCents);

  return (
    <div className="border-t border-line pt-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Subtotal</span>
        <span className="text-sm text-foreground">
          {formatPrice(subtotalCents, currency)}
        </span>
      </div>

      {discountCents > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted">
            Discount{discountCode ? ` (${discountCode})` : ""}
          </span>
          <span className="text-sm text-foreground">
            −{formatPrice(discountCents, currency)}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-muted">Shipping</span>
        <span className="text-sm text-foreground">Calculated at checkout</span>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
        <span className="text-sm text-foreground">Total</span>
        <span className="font-display text-xl text-foreground">
          {formatPrice(totalCents, currency)}
        </span>
      </div>
      <p className="mt-1 text-right text-xs text-muted">VAT included</p>
    </div>
  );
}
