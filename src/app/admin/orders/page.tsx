import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { bulkUpdateOrderStatus } from "@/lib/actions/orders";
import { BulkSelect } from "@/components/admin/BulkSelect";

// Admins need live order data, not a cached view -- orders change status
// via the Stripe webhook independently of any admin page load.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at, customers(email)")
    .order("created_at", { ascending: false });

  const ids = (orders ?? []).map((o) => o.id);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Orders</h1>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!orders || orders.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No orders yet.</p>
      ) : (
        <div className="mt-8">
          <BulkSelect
            ids={ids}
            bulkForm={(selected) => (
              <form action={bulkUpdateOrderStatus} className="flex items-center gap-2">
                {selected.map((id) => (
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
            )}
          >
            {({ isSelected, toggle, allSelected, toggleAll }) => (
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
                          checked={isSelected(order.id)}
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
            )}
          </BulkSelect>
        </div>
      )}
    </div>
  );
}
