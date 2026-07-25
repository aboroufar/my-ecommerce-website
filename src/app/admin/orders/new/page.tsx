import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraftOrder } from "@/lib/actions/draftOrders";
import { CreateOrderTotals } from "@/components/admin/CreateOrderTotals";
import type { ProductSearchOption } from "@/components/admin/PurchaseOrderLineItems";

export const dynamic = "force-dynamic";

export default async function NewDraftOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: clients }, { data: products }] = await Promise.all([
    supabase.from("clients").select("id, name, email").order("name", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, name, sku, price_cents, stock_qty, product_images(url, sort_order), product_option_types(id, sort_order, product_option_values(id, label, sort_order)), product_variants(id, sku, price_cents, stock_qty, product_variant_options(option_value_id))"
      )
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  const options: ProductSearchOption[] = [];
  for (const product of products ?? []) {
    const image = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];

    if (product.product_variants.length === 0) {
      options.push({
        productId: product.id,
        productName: product.name,
        variantId: null,
        variantLabel: null,
        sku: product.sku,
        imageUrl: image?.url ?? null,
        stockQty: product.stock_qty,
        priceCents: product.price_cents,
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
        imageUrl: image?.url ?? null,
        stockQty: variant.stock_qty,
        priceCents: variant.price_cents,
      });
    }
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Orders
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Create order</h1>

      {error && (
        <p className="mt-6 max-w-3xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createDraftOrder} className="mt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <CreateOrderTotals options={options} currency="eur" />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="border border-line p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Customer</h2>
              <ClientOrGuestFields clients={clients ?? []} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/admin/orders"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Discard
          </Link>
        </div>
      </form>
    </div>
  );
}

function ClientOrGuestFields({
  clients,
}: {
  clients: { id: string; name: string | null; email: string }[];
}) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground">Existing client</span>
        <select name="client_id" defaultValue="" className="border border-line bg-background px-3 py-2 text-sm">
          <option value="">— None, use guest details below —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email} ({c.email})
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Guest name</span>
          <input name="guest_name" className="border border-line bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Guest email</span>
          <input
            name="guest_email"
            type="email"
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        Choose an existing client above, or leave it unselected and fill in a guest name and email.
      </p>
    </div>
  );
}
