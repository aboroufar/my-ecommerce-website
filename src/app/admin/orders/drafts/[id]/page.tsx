import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { markDraftOrderPaid, sendDraftOrderInvoice } from "@/lib/actions/draftOrders";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  invoice_sent: "Invoice sent",
  completed: "Completed",
};

export default async function DraftOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const { data: draftOrder } = await supabase
    .from("draft_orders")
    .select(
      "id, status, guest_name, guest_email, subtotal_cents, shipping_cents, total_cents, currency, stripe_payment_link_url, invoice_sent_at, converted_order_id, created_at, clients(name, email)"
    )
    .eq("id", id)
    .single();

  if (!draftOrder) notFound();

  const { data: items } = await supabase
    .from("draft_order_items")
    .select("id, product_name, variant_label, quantity, unit_price_cents")
    .eq("draft_order_id", id);

  const markPaidWithId = markDraftOrderPaid.bind(null, id);
  const sendInvoiceWithId = sendDraftOrderInvoice.bind(null, id);

  return (
    <div>
      <Link
        href="/admin/orders/drafts"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Draft orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Draft order #{draftOrder.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Created {new Date(draftOrder.created_at).toLocaleString()} ·{" "}
            {draftOrder.clients?.email ?? draftOrder.guest_email ?? "No customer set"}
          </p>
        </div>
        <span className="border border-line px-3 py-1 text-xs font-medium uppercase tracking-wide text-foreground">
          {STATUS_LABELS[draftOrder.status] ?? draftOrder.status}
        </span>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {draftOrder.status === "completed" && draftOrder.converted_order_id && (
        <p className="mt-6 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          This draft was completed.{" "}
          <Link
            href={`/admin/orders/${draftOrder.converted_order_id}`}
            className="underline underline-offset-4"
          >
            View the order →
          </Link>
        </p>
      )}

      <ul className="mt-8 divide-y divide-line">
        {(items ?? []).map((item) => (
          <li key={item.id} className="flex items-center justify-between py-3 text-sm">
            <span className="text-foreground">
              {item.product_name}
              {item.variant_label && <span className="text-muted"> — {item.variant_label}</span>}
              {" × "}
              {item.quantity}
            </span>
            <span className="text-foreground">
              {formatPrice(item.unit_price_cents * item.quantity, draftOrder.currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="text-foreground">{formatPrice(draftOrder.subtotal_cents, draftOrder.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Shipping</span>
          <span className="text-foreground">{formatPrice(draftOrder.shipping_cents, draftOrder.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatPrice(draftOrder.total_cents, draftOrder.currency)}</span>
        </div>
      </div>

      {draftOrder.status !== "completed" && (
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <form action={markPaidWithId}>
            <button
              type="submit"
              className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Mark as paid
            </button>
          </form>

          {draftOrder.stripe_payment_link_url ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Payment link:</span>
              <a
                href={draftOrder.stripe_payment_link_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4"
              >
                {draftOrder.stripe_payment_link_url}
              </a>
            </div>
          ) : (
            <form action={sendInvoiceWithId}>
              <button
                type="submit"
                className="border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground"
              >
                Send invoice
              </button>
            </form>
          )}
        </div>
      )}

      {draftOrder.invoice_sent_at && (
        <p className="mt-3 text-xs text-muted">
          Invoice sent {new Date(draftOrder.invoice_sent_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
