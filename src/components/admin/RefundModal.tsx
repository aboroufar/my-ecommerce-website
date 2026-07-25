"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { createRefund } from "@/lib/actions/refunds";

export interface RefundableLine {
  orderItemId: string;
  productName: string;
  variantLabel: string | null;
  unitPriceCents: number;
  quantity: number;
  alreadyRefundedQty: number;
}

/**
 * Modal shell matches AddProductsModal/DiscountTypeModal's pattern
 * (fixed inset-0 z-30 backdrop, own `open` state). Unlike the
 * form-action pattern used elsewhere in the admin (e.g. orders.ts's
 * redirect-on-error actions), this calls createRefund directly via
 * useTransition since the payload -- per-line quantity + restock
 * toggle -- is structured, not something a plain <form> submit
 * naturally carries.
 */
export function RefundModal({
  orderId,
  currency,
  lines,
}: {
  orderId: string;
  currency: string;
  lines: RefundableLine[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [restock, setRestock] = useState<Record<string, boolean>>({});
  const [shippingRefund, setShippingRefund] = useState("0");
  const [reason, setReason] = useState("");

  const refundableLines = lines.filter((l) => l.quantity - l.alreadyRefundedQty > 0);

  function close() {
    setOpen(false);
    setError(null);
    setQuantities({});
    setRestock({});
    setShippingRefund("0");
    setReason("");
  }

  const shippingRefundCents = Math.round((Number(shippingRefund) || 0) * 100);
  const lineTotalCents = refundableLines.reduce((sum, line) => {
    const qty = quantities[line.orderItemId] ?? 0;
    return sum + qty * line.unitPriceCents;
  }, 0);
  const totalCents = lineTotalCents + shippingRefundCents;

  function handleSubmit() {
    setError(null);
    const selectedLines = refundableLines
      .map((line) => ({
        orderItemId: line.orderItemId,
        quantity: quantities[line.orderItemId] ?? 0,
        restock: restock[line.orderItemId] ?? false,
      }))
      .filter((line) => line.quantity > 0);

    startTransition(async () => {
      const result = await createRefund({
        orderId,
        lines: selectedLines,
        shippingRefundCents,
        reason: reason || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground"
      >
        Refund
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Refund order</h2>
              <button
                type="button"
                onClick={close}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {error && (
                <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              {refundableLines.length === 0 ? (
                <p className="text-sm text-muted">All line items have already been fully refunded.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 font-medium">Item</th>
                      <th className="w-20 py-2 font-medium">Qty</th>
                      <th className="w-24 py-2 font-medium">Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {refundableLines.map((line) => {
                      const remaining = line.quantity - line.alreadyRefundedQty;
                      return (
                        <tr key={line.orderItemId}>
                          <td className="py-2 text-foreground">
                            {line.productName}
                            {line.variantLabel && (
                              <span className="text-muted"> — {line.variantLabel}</span>
                            )}
                            <div className="text-xs text-muted">
                              {formatPrice(line.unitPriceCents, currency, "en")} each
                              {line.alreadyRefundedQty > 0 && ` · ${line.alreadyRefundedQty} already refunded`}
                            </div>
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              min={0}
                              max={remaining}
                              value={quantities[line.orderItemId] ?? 0}
                              onChange={(e) =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [line.orderItemId]: Math.min(
                                    remaining,
                                    Math.max(0, Number(e.target.value) || 0)
                                  ),
                                }))
                              }
                              className="w-16 border border-line bg-background px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="checkbox"
                              checked={restock[line.orderItemId] ?? false}
                              onChange={(e) =>
                                setRestock((prev) => ({ ...prev, [line.orderItemId]: e.target.checked }))
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Shipping refund</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={shippingRefund}
                  onChange={(e) => setShippingRefund(e.target.value)}
                  className="w-32 border border-line bg-background px-2 py-1.5 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Reason (optional)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full border border-line bg-background px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="text-sm text-foreground">
                Refund total: <strong>{formatPrice(totalCents, currency, "en")}</strong>
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || totalCents <= 0}
                  className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Refunding…" : "Issue refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
