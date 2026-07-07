import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Order history</h1>

      {!orders || orders.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No orders yet.{" "}
          <Link
            href="/products"
            className="text-accent underline underline-offset-4"
          >
            Start shopping
          </Link>
          .
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
