import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPurchaseOrder } from "@/lib/actions/purchaseOrders";
import { PurchaseOrderLineItems, type ProductSearchOption } from "@/components/admin/PurchaseOrderLineItems";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase.from("suppliers").select("id, company").order("company", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, name, sku, product_option_types(id, sort_order, product_option_values(id, label, sort_order)), product_variants(id, sku, product_variant_options(option_value_id))"
      )
      .order("name", { ascending: true }),
  ]);

  const options: ProductSearchOption[] = [];
  for (const product of products ?? []) {
    if (product.product_variants.length === 0) {
      options.push({
        productId: product.id,
        productName: product.name,
        variantId: null,
        variantLabel: null,
        sku: product.sku,
      });
      continue;
    }

    const labelByValueId = new Map<string, string>();
    for (const type of product.product_option_types) {
      for (const value of type.product_option_values) {
        labelByValueId.set(value.id, value.label);
      }
    }

    for (const variant of product.product_variants) {
      const labels = variant.product_variant_options
        .map((o) => labelByValueId.get(o.option_value_id))
        .filter((l): l is string => !!l);
      options.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantLabel: labels.length > 0 ? labels.join(" / ") : null,
        sku: variant.sku,
      });
    }
  }

  return (
    <div>
      <Link
        href="/admin/purchase-orders"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Purchase orders
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Create purchase order</h1>

      {error && (
        <p className="mt-6 max-w-3xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createPurchaseOrder} className="mt-8 grid max-w-3xl grid-cols-1 gap-8">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Supplier</span>
          <select
            name="supplier_id"
            className="border border-line bg-background px-3 py-2 text-sm"
          >
            <option value="">Select supplier</option>
            {(suppliers ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.company}
              </option>
            ))}
          </select>
        </label>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Products</h2>
          <div className="mt-3">
            <PurchaseOrderLineItems options={options} currency="eur" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Purchase order details
          </h2>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Reference number</span>
            <input
              name="reference_number"
              maxLength={255}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Note to supplier</span>
            <textarea
              name="note_to_supplier"
              rows={3}
              maxLength={5000}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Terms</span>
              <select
                name="payment_terms"
                defaultValue="none"
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
              <input type="hidden" name="currency" value="eur" />
              <select
                defaultValue="eur"
                disabled
                className="border border-line bg-surface px-3 py-2 text-sm text-muted"
              >
                <option value="eur">Euro (EUR €)</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <Link
            href="/admin/purchase-orders"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Discard
          </Link>
        </div>
      </form>
    </div>
  );
}
