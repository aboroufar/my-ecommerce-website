import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  received: "Received",
  cancelled: "Cancelled",
};

export default async function AdminPurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: purchaseOrders }, { data: items }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, reference_number, status, currency, created_at, suppliers(company)")
      .order("created_at", { ascending: false }),
    supabase.from("purchase_order_items").select("purchase_order_id, quantity_ordered, unit_cost_cents"),
  ]);

  const totalsByPo = new Map<string, number>();
  for (const item of items ?? []) {
    totalsByPo.set(
      item.purchase_order_id,
      (totalsByPo.get(item.purchase_order_id) ?? 0) + item.quantity_ordered * item.unit_cost_cents
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Purchase orders</h1>
        <Link
          href="/admin/purchase-orders/new"
          className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Create purchase order
        </Link>
      </div>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!purchaseOrders || purchaseOrders.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No purchase orders yet.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Reference</th>
              <th className="py-2 font-medium">Supplier</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Created</th>
              <th className="py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {purchaseOrders.map((po) => (
              <tr key={po.id}>
                <td className="py-3 text-foreground">
                  <Link
                    href={`/admin/purchase-orders/${po.id}`}
                    className="text-accent underline underline-offset-4"
                  >
                    {po.reference_number || `PO-${po.id.slice(0, 8)}`}
                  </Link>
                </td>
                <td className="py-3 text-muted">{po.suppliers?.company ?? "—"}</td>
                <td className="py-3 text-muted">{STATUS_LABELS[po.status] ?? po.status}</td>
                <td className="py-3 text-muted">{new Date(po.created_at).toLocaleDateString()}</td>
                <td className="py-3 text-foreground">
                  {formatPrice(totalsByPo.get(po.id) ?? 0, po.currency, "en")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
