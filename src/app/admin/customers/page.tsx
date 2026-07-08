import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const supabase = createAdminClient();

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, email, name, created_at")
      .order("created_at", { ascending: false }),
    // Only paid+ orders count toward "total spent" -- a pending/cancelled
    // order was never actually charged.
    supabase
      .from("orders")
      .select("customer_id, total_cents, currency, status")
      .not("customer_id", "is", null)
      .in("status", ["paid", "fulfilled", "refunded"]),
  ]);

  const statsByCustomer = new Map<
    string,
    { orderCount: number; totalCents: number; currency: string }
  >();
  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    const existing = statsByCustomer.get(order.customer_id) ?? {
      orderCount: 0,
      totalCents: 0,
      currency: order.currency,
    };
    existing.orderCount += 1;
    existing.totalCents += order.total_cents;
    statsByCustomer.set(order.customer_id, existing);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Customers</h1>

      {!customers || customers.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No customers yet.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Joined</th>
              <th className="py-2 font-medium">Orders</th>
              <th className="py-2 font-medium">Total spent</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => {
              const stats = statsByCustomer.get(customer.id);
              return (
                <tr key={customer.id}>
                  <td className="py-3 text-foreground">
                    {customer.email}
                    {customer.name && (
                      <span className="ml-2 text-muted">{customer.name}</span>
                    )}
                  </td>
                  <td className="py-3 text-muted">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-foreground">
                    {stats?.orderCount ?? 0}
                  </td>
                  <td className="py-3 text-foreground">
                    {stats
                      ? formatPrice(stats.totalCents, stats.currency)
                      : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-accent underline underline-offset-4"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
