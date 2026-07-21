"use client";

import Link from "next/link";
import { useState } from "react";

const DISCOUNT_TYPES = [
  {
    value: "amount_off_products",
    label: "Amount off products",
    hint: "Discount specific products or collections",
  },
  {
    value: "buy_x_get_y",
    label: "Buy X get Y",
    hint: "Discount specific products or collections",
  },
  {
    value: "amount_off_order",
    label: "Amount off order",
    hint: "Discount the total order amount",
  },
  {
    value: "free_shipping",
    label: "Free shipping",
    hint: "Offer free shipping on an order",
  },
] as const;

export function DiscountTypeModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Create discount
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Select discount type</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-line">
              {DISCOUNT_TYPES.map((type) => (
                <Link
                  key={type.value}
                  href={`/admin/discounts/new?type=${type.value}`}
                  className="flex items-center justify-between px-5 py-4 text-sm hover:bg-background"
                >
                  <span>
                    <span className="block font-medium text-foreground">{type.label}</span>
                    <span className="text-muted">{type.hint}</span>
                  </span>
                  <span className="text-muted">›</span>
                </Link>
              ))}
            </div>
            <div className="flex justify-end border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
