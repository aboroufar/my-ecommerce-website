"use client";

import { useState } from "react";
import { updateReceivedQuantities } from "@/lib/actions/purchaseOrders";

export interface ReceivableItem {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity_ordered: number;
  quantity_received: number;
}

export function ReceiveItemsForm({
  purchaseOrderId,
  items,
}: {
  purchaseOrderId: string;
  items: ReceivableItem[];
}) {
  const [received, setReceived] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.quantity_received]))
  );

  return (
    <form
      action={updateReceivedQuantities.bind(null, purchaseOrderId)}
      className="flex flex-col gap-3"
    >
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          items.map((i) => ({ id: i.id, quantity_received: received[i.id] ?? 0 }))
        )}
      />
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground">
            {item.product_name}
            {item.variant_label && <span className="text-muted"> — {item.variant_label}</span>}
          </span>
          <label className="flex shrink-0 items-center gap-2 text-muted">
            <input
              type="number"
              min={0}
              value={received[item.id] ?? 0}
              onChange={(e) =>
                setReceived((prev) => ({
                  ...prev,
                  [item.id]: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="w-20 border border-line bg-background px-2 py-1 text-sm text-foreground"
            />
            <span>of {item.quantity_ordered}</span>
          </label>
        </div>
      ))}
      <button
        type="submit"
        className="mt-2 self-start border border-line px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
      >
        Save received quantities
      </button>
    </form>
  );
}
