"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { DraftOrderLineItems } from "./DraftOrderLineItems";
import type { ProductSearchOption } from "./PurchaseOrderLineItems";

/**
 * Wraps DraftOrderLineItems with the Payment card's shipping input and
 * live-computed Total -- lifted here (rather than folded into
 * DraftOrderLineItems) because shipping is an order-level concept, not
 * a line-items concept. DraftOrderLineItems reports its running
 * subtotal up via onSubtotalChange; this component combines it with
 * its own shipping_amount input state to render the Total row.
 */
export function CreateOrderTotals({
  options,
  currency,
}: {
  options: ProductSearchOption[];
  currency: string;
}) {
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [shippingAmount, setShippingAmount] = useState("0");

  const shippingCents = Math.round((Number(shippingAmount) || 0) * 100);
  const totalCents = subtotalCents + shippingCents;

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Products</h2>
        <div className="mt-3">
          <DraftOrderLineItems options={options} currency={currency} onSubtotalChange={setSubtotalCents} />
        </div>
      </div>

      <div className="border border-line p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Payment</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="text-foreground">{formatPrice(subtotalCents, currency, "en")}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Shipping</span>
            <label className="flex items-center gap-1.5">
              <input
                name="shipping_amount"
                type="number"
                min={0}
                step="0.01"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(e.target.value)}
                className="w-24 border border-line bg-background px-2 py-1 text-right text-sm"
              />
            </label>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2 font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatPrice(totalCents, currency, "en")}</span>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          Create order
        </button>
      </div>
    </div>
  );
}
