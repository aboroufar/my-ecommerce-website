import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  invoice_sent: "Invoice sent",
  completed: "Completed",
};

export default async function DraftOrdersPage() {
  const supabase = createAdminClient();
  const { data: draftOrders } = await supabase
    .from("draft_orders")
    .select("id, status, guest_name, guest_email, total_cents, currency, created_at, clients(name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Orders
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Draft orders</h1>

      {!draftOrders || draftOrders.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No draft orders yet.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Customer</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {draftOrders.map((draft) => (
              <tr key={draft.id}>
                <td className="py-3 text-foreground">
                  {draft.clients?.name ?? draft.guest_name ?? (
                    <span className="text-muted">—</span>
                  )}
                  <div className="text-xs text-muted">{draft.clients?.email ?? draft.guest_email}</div>
                </td>
                <td className="py-3 text-muted">{STATUS_LABELS[draft.status] ?? draft.status}</td>
                <td className="py-3 text-foreground">{formatPrice(draft.total_cents, draft.currency)}</td>
                <td className="py-3 text-muted">{new Date(draft.created_at).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/orders/drafts/${draft.id}`}
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
