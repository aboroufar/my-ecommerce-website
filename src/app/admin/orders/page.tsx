import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

// Admins need live order data, not a cached view -- orders change status
// via the Stripe webhook independently of any admin page load.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at, customers(email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No orders yet.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
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
      )}
    </div>
  );
}
