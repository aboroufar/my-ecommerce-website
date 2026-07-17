import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "All", statuses: null },
  { key: "processing", label: "Processing", statuses: ["pending", "paid"] },
  { key: "shipped", label: "Shipped", statuses: ["fulfilled"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "refunded"] },
] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = TABS.find((t) => t.key === status) ?? TABS[0];

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at")
    .order("created_at", { ascending: false });

  if (activeTab.statuses) {
    query = query.in("status", activeTab.statuses);
  }

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Order history</h1>

      <div className="mt-6 flex gap-2 border-b border-line text-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/account/orders" : `/account/orders?status=${tab.key}`}
            className={`-mb-px border-b-2 px-1 pb-3 transition-colors ${
              activeTab.key === tab.key
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!orders || orders.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {activeTab.key === "all" ? (
            <>
              No orders yet.{" "}
              <Link
                href="/products"
                className="text-accent-text underline underline-offset-4"
              >
                Start shopping
              </Link>
              .
            </>
          ) : (
            `No ${activeTab.label.toLowerCase()} orders.`
          )}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between py-4">
              <div>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="text-sm text-foreground hover:underline"
                >
                  Order #{order.id.slice(0, 8)}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  <span className="capitalize">{order.status}</span>
                </p>
              </div>
              <span className="text-sm text-foreground">
                {formatPrice(order.total_cents, order.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
