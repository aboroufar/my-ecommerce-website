import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraftOrder } from "@/lib/actions/draftOrders";
import { CreateOrderTotals } from "@/components/admin/CreateOrderTotals";
import { CustomerCardPicker, type ClientOption } from "@/components/admin/CustomerCardPicker";
import type { ProductSearchOption } from "@/components/admin/PurchaseOrderLineItems";

export const dynamic = "force-dynamic";

export default async function NewDraftOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: clients }, { data: products }, { data: orderCounts }, { data: addresses }] =
    await Promise.all([
      supabase.from("clients").select("id, name, email").order("name", { ascending: true }),
      supabase
        .from("products")
        .select(
          "id, name, sku, price_cents, stock_qty, product_images(url, sort_order), product_option_types(id, sort_order, product_option_values(id, label, sort_order)), product_variants(id, sku, price_cents, stock_qty, product_variant_options(option_value_id))"
        )
        .eq("status", "active")
        .order("name", { ascending: true }),
      supabase.from("orders").select("client_id").not("client_id", "is", null),
      supabase
        .from("addresses")
        .select("client_id, line1, line2, city, region, postal_code, country, is_default, is_billing"),
    ]);

  const orderCountByClient = new Map<string, number>();
  for (const order of orderCounts ?? []) {
    if (!order.client_id) continue;
    orderCountByClient.set(order.client_id, (orderCountByClient.get(order.client_id) ?? 0) + 1);
  }

  const addressesByClient = new Map<string, typeof addresses>();
  for (const address of addresses ?? []) {
    const list = addressesByClient.get(address.client_id) ?? [];
    list.push(address);
    addressesByClient.set(address.client_id, list);
  }

  const clientOptions: ClientOption[] = (clients ?? []).map((c) => {
    const clientAddresses = addressesByClient.get(c.id) ?? [];
    const shippingAddress = clientAddresses.find((a) => a.is_default) ?? clientAddresses[0] ?? null;
    const billingAddress = clientAddresses.find((a) => a.is_billing) ?? null;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      orderCount: orderCountByClient.get(c.id) ?? 0,
      shippingAddress,
      billingAddress,
    };
  });

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
              <CustomerCardPicker clients={clientOptions} />
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
