"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { bulkUpdateOrderStatus } from "@/lib/actions/orders";

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  customers: { email: string } | null;
}

/**
 * Self-contained client component, same reasoning as ProductsBulkTable --
 * Server Components can't pass function props into Client Components, so
 * this owns its own selection state and full table markup rather than
 * being a generic wrapper driven by render-prop children.
 */
export function OrdersBulkTable({ orders }: { orders: OrderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ids = orders.map((o) => o.id);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }

  const selectedIds = [...selected];
  const allSelected = ids.length > 0 && selected.size === ids.length;

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3 border border-line bg-surface px-4 py-3">
          <span className="text-xs text-muted">{selectedIds.length} selected</span>
          <form action={bulkUpdateOrderStatus} className="flex items-center gap-2">
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="order_ids" value={id} />
            ))}
            <select
              name="bulk_status"
              defaultValue="fulfilled"
              className="border border-line bg-background px-2 py-1.5 text-xs"
            >
              <option value="pending">Set to pending</option>
              <option value="paid">Set to paid</option>
              <option value="fulfilled">Set to fulfilled</option>
              <option value="cancelled">Set to cancelled</option>
              <option value="refunded">Set to refunded</option>
            </select>
            <button
              type="submit"
              className="bg-accent px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Apply
            </button>
          </form>
        </div>
      )}

      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="w-8 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all orders"
              />
            </th>
            <th className="py-2 font-medium">Order</th>
            <th className="py-2 font-medium">Customer</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Total</th>
            <th className="py-2 font-medium">Date</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="py-3">
                <input
                  type="checkbox"
                  checked={selected.has(order.id)}
                  onChange={() => toggle(order.id)}
                  aria-label={`Select order ${order.id.slice(0, 8)}`}
                />
              </td>
              <td className="py-3 text-foreground">
                #{order.id.slice(0, 8)}
              </td>
              <td className="py-3 text-foreground">
                {order.customers?.email ?? (
                  <span className="text-muted">Guest</span>
                )}
              </td>
              <td className="py-3 text-muted capitalize">{order.status}</td>
              <td className="py-3 text-foreground">
                {formatPrice(order.total_cents, order.currency)}
              </td>
              <td className="py-3 text-muted">
                {new Date(order.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-accent underline underline-offset-4"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
