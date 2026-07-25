"use client";

import { useState } from "react";
import { restockOrder, cancelOrder } from "@/lib/actions/orders";

/**
 * Top action bar for the order detail page: a direct "Restock" button
 * and a "More actions ▾" dropdown, mirroring OrdersBulkTable's
 * "Mark as ▾" mechanics (relative wrapper, click-outside overlay,
 * absolute panel) since this is the only interactive piece on an
 * otherwise server-rendered page.
 */
export function OrderActionsMenu({ orderId }: { orderId: string }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <form action={restockOrder.bind(null, orderId)}>
        <button
          type="submit"
          className="border border-line bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground"
        >
          Restock
        </button>
      </form>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className="border border-line bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground"
        >
          More actions ▾
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-40 border border-line bg-surface py-1 shadow-md">
              <form action={cancelOrder.bind(null, orderId)}>
                <button
                  type="submit"
                  className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-accent-soft/60"
                >
                  Cancel order
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
