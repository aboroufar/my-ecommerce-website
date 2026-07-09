import { createAdminClient } from "@/lib/supabase/admin";
import { OrdersBulkTable } from "@/components/admin/OrdersBulkTable";

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
          <OrdersBulkTable orders={orders} />
        </div>
      )}
    </div>
  );
}
