"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { bulkMarkOrdersFulfilled, bulkCancelOrders } from "@/lib/actions/orders";

interface OrderRow {
  id: string;
  financial_status: string;
  fulfillment_status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  clients: { email: string } | null;
}

/**
 * Self-contained client component, same reasoning as ProductsBulkTable --
 * Server Components can't pass function props into Client Components, so
 * this owns its own selection state and full table markup rather than
 * being a generic wrapper driven by render-prop children.
 *
 * The bulk actions are exposed as a single "Mark as" dropdown (matching
 * Shopify's own list-view bulk menu) over just the two statuses this
 * app's fulfillment_status enum actually supports as bulk targets
 * (fulfilled/cancelled) -- Shopify's own menu also has "In progress"/
 * "On hold"/"Delivered", but those states don't exist in this schema, so
 * they're deliberately not offered rather than faked.
 */
export function OrdersBulkTable({ orders }: { orders: OrderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [markAsOpen, setMarkAsOpen] = useState(false);
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setMarkAsOpen((open) => !open)}
              className="border border-line bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground"
            >
              Mark as ▾
            </button>
            {markAsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMarkAsOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-40 border border-line bg-surface py-1 shadow-md">
                  <form action={bulkMarkOrdersFulfilled}>
                    {selectedIds.map((id) => (
                      <input key={id} type="hidden" name="order_ids" value={id} />
                    ))}
                    <button
                      type="submit"
                      className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent-soft/60"
                    >
                      Fulfilled
                    </button>
                  </form>
                  <form action={bulkCancelOrders}>
                    {selectedIds.map((id) => (
                      <input key={id} type="hidden" name="order_ids" value={id} />
                    ))}
                    <button
                      type="submit"
                      className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent-soft/60"
                    >
                      Cancelled
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
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
            <th className="w-6 py-2" />
            <th className="py-2 font-medium">Order</th>
            <th className="py-2 font-medium">Client</th>
            <th className="py-2 font-medium">Payment</th>
            <th className="py-2 font-medium">Fulfillment</th>
            <th className="py-2 font-medium">Shipping</th>
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
              <td className="py-3">
                {order.financial_status === "pending" && (
                  <span title="Payment pending">
                    <WarningIcon className="h-4 w-4 text-amber-600" />
                  </span>
                )}
              </td>
              <td className="py-3 text-foreground">
                #{order.id.slice(0, 8)}
              </td>
              <td className="py-3 text-foreground">
                {order.clients?.email ?? (
                  <span className="text-muted">Guest</span>
                )}
              </td>
              <td className="py-3 text-muted capitalize">{order.financial_status.replace(/_/g, " ")}</td>
              <td className="py-3 text-muted capitalize">{order.fulfillment_status.replace(/_/g, " ")}</td>
              <td className="py-3 text-muted">
                {order.tracking_number ? (
                  order.tracking_url ? (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline underline-offset-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Tracking added
                    </a>
                  ) : (
                    "Tracking added"
                  )
                ) : (
                  "—"
                )}
              </td>
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

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="M12 4 2.5 20h19L12 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10v4.5" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
