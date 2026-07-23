import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { deletePurchaseOrder } from "@/lib/actions/purchaseOrders";
import { PurchaseOrderStatusForm } from "@/components/admin/PurchaseOrderStatusForm";
import { ReceiveItemsForm } from "@/components/admin/ReceiveItemsForm";

export const dynamic = "force-dynamic";

const PAYMENT_TERM_LABELS: Record<string, string> = {
  none: "None",
  cod: "Cash on delivery",
  receipt: "Payment on receipt",
  advance: "Payment in advance",
  net7: "Net 7",
  net15: "Net 15",
  net30: "Net 30",
  net45: "Net 45",
  net60: "Net 60",
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: po }, { data: items }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select(
        "id, status, reference_number, note_to_supplier, payment_terms, currency, created_at, suppliers(id, company, email, phone)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("purchase_order_items")
      .select("id, product_name, variant_label, quantity_ordered, quantity_received, unit_cost_cents")
      .eq("purchase_order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!po) notFound();

  const lineItems = items ?? [];
  const totalCents = lineItems.reduce((sum, i) => sum + i.quantity_ordered * i.unit_cost_cents, 0);
  const totalItems = lineItems.reduce((sum, i) => sum + i.quantity_ordered, 0);

  return (
    <div>
      <Link
        href="/admin/purchase-orders"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Purchase orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">
          {po.reference_number || `PO-${po.id.slice(0, 8)}`}
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/purchase-orders/${po.id}/edit`}
            className="text-sm text-foreground underline underline-offset-4 hover:text-accent"
          >
            Edit
          </Link>
          <form action={deletePurchaseOrder.bind(null, po.id)}>
            <button
              type="submit"
              className="text-sm text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {error && (
        <p className="mt-6 max-w-3xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Products</h2>
            {lineItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No products on this purchase order.</p>
            ) : (
              <>
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium">Ordered</th>
                      <th className="py-2 font-medium">Received</th>
                      <th className="py-2 font-medium">Unit cost</th>
                      <th className="py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 text-foreground">
                          {item.product_name}
                          {item.variant_label && (
                            <span className="text-muted"> — {item.variant_label}</span>
                          )}
                        </td>
                        <td className="py-3 text-muted">{item.quantity_ordered}</td>
                        <td className="py-3 text-muted">{item.quantity_received}</td>
                        <td className="py-3 text-muted">
                          {formatPrice(item.unit_cost_cents, po.currency, "en")}
                        </td>
                        <td className="py-3 text-right text-foreground">
                          {formatPrice(item.quantity_ordered * item.unit_cost_cents, po.currency, "en")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
                  <span className="text-muted">
                    {lineItems.length} variant{lineItems.length === 1 ? "" : "s"} ({totalItems} item
                    {totalItems === 1 ? "" : "s"})
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(totalCents, po.currency, "en")}
                  </span>
                </div>
              </>
            )}
          </div>

          {lineItems.length > 0 && po.status !== "draft" && po.status !== "cancelled" && (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                Receive inventory
              </h2>
              <p className="mt-2 text-sm text-muted">
                Record how many units of each item have arrived. This does not update product
                stock levels.
              </p>
              <div className="mt-3">
                <ReceiveItemsForm purchaseOrderId={po.id} items={lineItems} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Status</h2>
            <div className="mt-3">
              <PurchaseOrderStatusForm purchaseOrderId={po.id} status={po.status} />
            </div>
          </div>

          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Supplier</h2>
            {po.suppliers ? (
              <div className="mt-3 text-sm text-foreground">
                <p>{po.suppliers.company}</p>
                {po.suppliers.email && <p className="mt-1 text-muted">{po.suppliers.email}</p>}
                {po.suppliers.phone && <p className="mt-1 text-muted">{po.suppliers.phone}</p>}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No supplier selected.</p>
            )}
          </div>

          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Purchase order details
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Terms</dt>
                <dd className="text-foreground">{PAYMENT_TERM_LABELS[po.payment_terms] ?? po.payment_terms}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Currency</dt>
                <dd className="text-foreground">{po.currency.toUpperCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Created</dt>
                <dd className="text-foreground">{new Date(po.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
            {po.note_to_supplier && (
              <>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Note to supplier
                </p>
                <p className="mt-1 text-sm text-foreground">{po.note_to_supplier}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
