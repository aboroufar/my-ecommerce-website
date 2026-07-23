"use client";

import { updatePurchaseOrderStatus } from "@/lib/actions/purchaseOrders";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function PurchaseOrderStatusForm({
  purchaseOrderId,
  status,
}: {
  purchaseOrderId: string;
  status: string;
}) {
  return (
    <form action={updatePurchaseOrderStatus.bind(null, purchaseOrderId)} className="flex gap-2">
      <select
        name="status"
        defaultValue={status}
        className="flex-1 border border-line bg-background px-3 py-2 text-sm"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="shrink-0 border border-line px-3 py-2 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
      >
        Update
      </button>
    </form>
  );
}
