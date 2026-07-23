import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePurchaseOrderDetails } from "@/lib/actions/purchaseOrders";
import { SupplierPicker } from "@/components/admin/SupplierPicker";

export const dynamic = "force-dynamic";

export default async function EditPurchaseOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: po }, { data: suppliers }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, supplier_id, reference_number, note_to_supplier, payment_terms, currency")
      .eq("id", id)
      .single(),
    supabase.from("suppliers").select("id, company").order("company", { ascending: true }),
  ]);

  if (!po) notFound();

  return (
    <div>
      <Link
        href={`/admin/purchase-orders/${id}`}
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Back
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Edit purchase order</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updatePurchaseOrderDetails.bind(null, id)}
        className="mt-8 flex max-w-2xl flex-col gap-6"
      >
        <SupplierPicker suppliers={suppliers ?? []} defaultSupplierId={po.supplier_id} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Reference number</span>
          <input
            name="reference_number"
            maxLength={255}
            defaultValue={po.reference_number ?? ""}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Note to supplier</span>
          <textarea
            name="note_to_supplier"
            rows={3}
            maxLength={5000}
            defaultValue={po.note_to_supplier ?? ""}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Terms</span>
            <select
              name="payment_terms"
              defaultValue={po.payment_terms}
              className="border border-line bg-background px-3 py-2 text-sm"
            >
              <option value="none">None</option>
              <option value="cod">Cash on delivery</option>
              <option value="receipt">Payment on receipt</option>
              <option value="advance">Payment in advance</option>
              <option value="net7">Net 7</option>
              <option value="net15">Net 15</option>
              <option value="net30">Net 30</option>
              <option value="net45">Net 45</option>
              <option value="net60">Net 60</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Currency</span>
            <input type="hidden" name="currency" value={po.currency} />
            <select
              defaultValue={po.currency}
              disabled
              className="border border-line bg-surface px-3 py-2 text-sm text-muted"
            >
              <option value="eur">Euro (EUR €)</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <Link
            href={`/admin/purchase-orders/${id}`}
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Discard
          </Link>
        </div>
      </form>
    </div>
  );
}
