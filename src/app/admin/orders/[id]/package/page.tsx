import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { fetchShippingRates, buyShippingLabel, clearPendingRates } from "@/lib/actions/orders";
import { PackageWeightForm, type PendingRate } from "@/components/admin/PackageWeightForm";

export const dynamic = "force-dynamic";

interface ShippingAddress {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export default async function AdminOrderPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, currency, total_cents, shipping_address, pending_rates")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [{ data: items }, { data: packageProfiles }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, product_name, variant_label, quantity")
      .eq("order_id", id),
    supabase
      .from("package_profiles")
      .select("id, name, length_cm, width_cm, height_cm, empty_weight_grams")
      .order("name", { ascending: true }),
  ]);

  const shipping = order.shipping_address as ShippingAddress | null;
  const pendingRates = order.pending_rates as PendingRate[] | null;
  const fetchRatesWithId = fetchShippingRates.bind(null, id);
  const buyLabelWithId = buyShippingLabel.bind(null, id);
  const clearRatesWithId = clearPendingRates.bind(null, id);

  return (
    <div>
      <Link
        href={`/admin/orders/${id}`}
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Order #{id.slice(0, 8)}
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Create shipping label</h1>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="border border-line p-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Shipping address</h3>
            {shipping?.address ? (
              <p className="mt-3 text-sm text-foreground">
                {shipping.name}
                <br />
                {shipping.address.line1}
                {shipping.address.line2 ? `, ${shipping.address.line2}` : ""}
                <br />
                {shipping.address.city}, {shipping.address.state} {shipping.address.postal_code}
                <br />
                {shipping.address.country}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">No shipping address on this order.</p>
            )}
          </div>

          {!pendingRates || pendingRates.length === 0 ? (
            <PackageWeightForm
              items={(items ?? []).map((item) => ({
                id: item.id,
                productName: item.product_name,
                variantLabel: item.variant_label,
                quantity: item.quantity,
              }))}
              packageProfiles={(packageProfiles ?? []).map((p) => ({
                id: p.id,
                name: p.name,
                lengthCm: p.length_cm,
                widthCm: p.width_cm,
                heightCm: p.height_cm,
                emptyWeightGrams: p.empty_weight_grams,
              }))}
              fetchRatesAction={fetchRatesWithId}
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="border border-line p-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Summary</h3>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted">Total</span>
              <span className="text-foreground">{formatPrice(order.total_cents, order.currency)}</span>
            </div>
            <div className="mt-3 border-t border-line pt-3 text-sm text-muted">Shipping date: Today</div>
          </div>

          {pendingRates && pendingRates.length > 0 && (
            <div className="border border-line p-5">
              <form action={buyLabelWithId} className="space-y-3">
                <ul className="space-y-2">
                  {pendingRates.map((rate, i) => (
                    <li key={rate.rateId}>
                      <label className="flex items-center gap-3 border border-line p-3 text-sm">
                        <input
                          type="radio"
                          name="rate_id"
                          value={rate.rateId}
                          defaultChecked={i === 0}
                          required
                        />
                        <span className="flex-1">
                          {rate.provider} — {rate.serviceLevel}
                          {rate.estimatedDays != null && ` · ${rate.estimatedDays}d`}
                        </span>
                        <span className="font-medium text-foreground">
                          {rate.amount} {rate.currency}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  type="submit"
                  className="w-full bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Buy shipping label
                </button>
                <button
                  type="submit"
                  formAction={clearRatesWithId}
                  className="w-full text-center text-xs text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Start over
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
