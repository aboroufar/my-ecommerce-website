import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrdersBulkTable } from "@/components/admin/OrdersBulkTable";
import { AdminOrdersFilterBar } from "@/components/admin/AdminOrdersFilterBar";

// Admins need live order data, not a cached view -- orders change status
// via the Stripe webhook independently of any admin page load.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    q?: string;
    financial_status?: string;
    fulfillment_status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { error, q, financial_status, fulfillment_status, from, to } = await searchParams;
  const supabase = createAdminClient();
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, financial_status, fulfillment_status, total_cents, currency, created_at, clients(email)")
    .order("created_at", { ascending: false });

  const query = q?.trim().toLowerCase() ?? "";
  const fromDate = from ? new Date(from) : null;
  // Day-granularity range: "to" should include the entire selected day, not
  // stop at its midnight, so add one day and compare with "<" instead of
  // "<=" against the raw created_at timestamp.
  const toDate = to ? new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000) : null;

  const orders = (allOrders ?? []).filter((o) => {
    if (financial_status && o.financial_status !== financial_status) return false;
    if (fulfillment_status && o.fulfillment_status !== fulfillment_status) return false;
    if (fromDate && new Date(o.created_at) < fromDate) return false;
    if (toDate && new Date(o.created_at) >= toDate) return false;
    if (query) {
      const haystack = `${o.id} ${o.clients?.email ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const hasAnyFilter = Boolean(q || financial_status || fulfillment_status || from || to);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Orders</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders/drafts"
            className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            Drafts
          </Link>
          <Link
            href="/admin/orders/new"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Create order
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!allOrders || allOrders.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No orders yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <AdminOrdersFilterBar />
          <p className="text-xs text-muted">
            {orders.length} of {allOrders.length} order
            {allOrders.length === 1 ? "" : "s"}
          </p>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              No orders match these filters.
              {hasAnyFilter && (
                <>
                  {" "}
                  <a href="/admin/orders" className="text-accent underline underline-offset-4">
                    Clear filters
                  </a>
                </>
              )}
            </p>
          ) : (
            <OrdersBulkTable orders={orders} />
          )}
        </div>
      )}
    </div>
  );
}
