import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import {
  markOrderFulfilled,
  fetchShippingRates,
  buyShippingLabel,
  clearPendingRates,
} from "@/lib/actions/orders";
import { RefundModal } from "@/components/admin/RefundModal";
import type { FinancialStatus, FulfillmentStatus } from "@/lib/supabase/types";

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

interface PendingRate {
  rateId: string;
  provider: string;
  serviceLevel: string;
  amount: string;
  currency: string;
  estimatedDays: number | null;
}

const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  voided: "Voided",
};

const FINANCIAL_STATUS_STYLES: Record<FinancialStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  partially_refunded: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-red-50 text-red-700 border-red-200",
  voided: "bg-gray-50 text-gray-700 border-gray-200",
};

const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  unfulfilled: "Unfulfilled",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const FULFILLMENT_STATUS_STYLES: Record<FulfillmentStatus, string> = {
  unfulfilled: "bg-amber-50 text-amber-700 border-amber-200",
  partially_fulfilled: "bg-amber-50 text-amber-700 border-amber-200",
  fulfilled: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
};

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block border px-3 py-1 text-xs font-medium uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}

export default async function AdminOrderDetailPage({
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
    .select(
      "id, client_id, financial_status, fulfillment_status, total_cents, discount_cents, discount_code, shipping_cents, currency, created_at, shipping_address, stripe_payment_intent_id, clients(name, email), carrier, tracking_number, tracking_url, label_url, pending_rates"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [{ data: items }, { data: refunds }, { count: clientOrderCount }, { data: billingAddress }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select("id, product_name, variant_label, quantity, unit_price_cents")
        .eq("order_id", id),
      supabase
        .from("refunds")
        .select(
          "id, amount_cents, reason, created_at, refund_line_items(order_item_id, quantity, amount_cents, restocked)"
        )
        .eq("order_id", id)
        .order("created_at", { ascending: false }),
      order.client_id
        ? supabase.from("orders").select("id", { count: "exact", head: true }).eq("client_id", order.client_id)
        : Promise.resolve({ count: null }),
      order.client_id
        ? supabase
            .from("addresses")
            .select("line1, line2, city, region, postal_code, country")
            .eq("client_id", order.client_id)
            .eq("is_billing", true)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const financialStatus = order.financial_status as FinancialStatus;
  const fulfillmentStatus = order.fulfillment_status as FulfillmentStatus;
  const shipping = order.shipping_address as ShippingAddress | null;
  const pendingRates = order.pending_rates as PendingRate[] | null;
  const markFulfilledWithId = markOrderFulfilled.bind(null, id);
  const fetchRatesWithId = fetchShippingRates.bind(null, id);
  const buyLabelWithId = buyShippingLabel.bind(null, id);
  const clearRatesWithId = clearPendingRates.bind(null, id);

  const refundedQtyByItem = new Map<string, number>();
  for (const refund of refunds ?? []) {
    for (const line of refund.refund_line_items) {
      refundedQtyByItem.set(line.order_item_id, (refundedQtyByItem.get(line.order_item_id) ?? 0) + line.quantity);
    }
  }
  const totalRefundedCents = (refunds ?? []).reduce((sum, r) => sum + r.amount_cents, 0);

  const subtotalCents = (items ?? []).reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed {new Date(order.created_at).toLocaleString()} ·{" "}
            {order.clients?.email ?? "Guest"}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
        {/* Fulfillment card */}
        <div className="border border-line p-5">
          <div className="flex items-center justify-between">
            <StatusBadge
              label={FULFILLMENT_STATUS_LABELS[fulfillmentStatus]}
              className={FULFILLMENT_STATUS_STYLES[fulfillmentStatus]}
            />
          </div>

          <ul className="mt-4 divide-y divide-line">
            {(items ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">
                  {item.product_name}
                  {item.variant_label && <span className="text-muted"> — {item.variant_label}</span>}
                  {" × "}
                  {item.quantity}
                </span>
                <span className="text-foreground">
                  {formatPrice(item.unit_price_cents * item.quantity, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          {shipping?.address && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Shipping address</h3>
              <p className="mt-2 text-sm text-foreground">
                {shipping.name}
                <br />
                {shipping.address.line1}
                {shipping.address.line2 ? `, ${shipping.address.line2}` : ""}
                <br />
                {shipping.address.city}, {shipping.address.state} {shipping.address.postal_code}
                <br />
                {shipping.address.country}
              </p>
            </div>
          )}

          {financialStatus !== "paid" && financialStatus !== "partially_refunded" ? (
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              Fulfillment actions are available once this order is paid.
            </p>
          ) : (
            <div className="mt-4 border-t border-line pt-4">
              {order.tracking_number ? (
                <div className="space-y-1 text-sm text-foreground">
                  <p>
                    {order.carrier} · {order.tracking_number}
                  </p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-accent underline underline-offset-4"
                    >
                      Track shipment →
                    </a>
                  )}
                  {order.label_url && (
                    <a
                      href={order.label_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-accent underline underline-offset-4"
                    >
                      View label PDF →
                    </a>
                  )}
                </div>
              ) : pendingRates && pendingRates.length > 0 ? (
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
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      Buy label
                    </button>
                    <button
                      type="submit"
                      formAction={clearRatesWithId}
                      className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
                    >
                      Start over
                    </button>
                  </div>
                </form>
              ) : shipping?.address ? (
                <form action={fetchRatesWithId} className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted">Weight (g)</span>
                    <input
                      name="weight_grams"
                      type="number"
                      min={1}
                      step="1"
                      required
                      className="border border-line bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted">Length (cm)</span>
                    <input
                      name="length_cm"
                      type="number"
                      min={0.1}
                      step="0.1"
                      required
                      className="border border-line bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted">Width (cm)</span>
                    <input
                      name="width_cm"
                      type="number"
                      min={0.1}
                      step="0.1"
                      required
                      className="border border-line bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted">Height (cm)</span>
                    <input
                      name="height_cm"
                      type="number"
                      min={0.1}
                      step="0.1"
                      required
                      className="border border-line bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="col-span-2 bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Get rates
                  </button>
                </form>
              ) : null}

              {fulfillmentStatus !== "fulfilled" && fulfillmentStatus !== "cancelled" && (
                <form action={markFulfilledWithId} className="mt-3">
                  <button
                    type="submit"
                    className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
                  >
                    Mark as fulfilled
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Payment card */}
        <div className="border border-line p-5">
          <div className="flex items-center justify-between">
            <StatusBadge
              label={FINANCIAL_STATUS_LABELS[financialStatus]}
              className={FINANCIAL_STATUS_STYLES[financialStatus]}
            />
            {(financialStatus === "paid" || financialStatus === "partially_refunded") && (
              <RefundModal
                orderId={order.id}
                currency={order.currency}
                lines={(items ?? []).map((item) => ({
                  orderItemId: item.id,
                  productName: item.product_name,
                  variantLabel: item.variant_label,
                  unitPriceCents: item.unit_price_cents,
                  quantity: item.quantity,
                  alreadyRefundedQty: refundedQtyByItem.get(item.id) ?? 0,
                }))}
              />
            )}
          </div>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="text-foreground">{formatPrice(subtotalCents, order.currency)}</span>
            </div>
            {order.discount_cents > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Discount{order.discount_code ? ` (${order.discount_code})` : ""}</span>
                <span className="text-foreground">-{formatPrice(order.discount_cents, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span className="text-foreground">{formatPrice(order.shipping_cents, order.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatPrice(order.total_cents, order.currency)}</span>
            </div>
            {totalRefundedCents > 0 && (
              <div className="flex justify-between text-red-700">
                <span>Refunded</span>
                <span>-{formatPrice(totalRefundedCents, order.currency)}</span>
              </div>
            )}
          </div>

          {order.stripe_payment_intent_id && (
            <div className="mt-4 border-t border-line pt-4">
              <a
                href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-accent underline underline-offset-4"
              >
                View payment in Stripe →
              </a>
            </div>
          )}

          {refunds && refunds.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Refund history</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {refunds.map((refund) => (
                  <li key={refund.id} className="text-foreground">
                    {formatPrice(refund.amount_cents, order.currency)} ·{" "}
                    {new Date(refund.created_at).toLocaleDateString()}
                    {refund.reason && <span className="text-muted"> — {refund.reason}</span>}
                    {refund.refund_line_items.some((l) => l.restocked) && (
                      <span className="text-muted"> (restocked)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

        {/* Sidebar: customer + addresses. Order risk/conversion summary/
            tags/notes from the reference screenshot are deliberately
            omitted -- none of that has any backing data in this schema
            (no fraud scoring, no analytics tracking, no order tags/notes
            table), so faking those sections would show empty or
            hardcoded content instead of real information. */}
        <div className="flex flex-col gap-6">
          <div className="border border-line p-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Customer</h3>
            {order.clients ? (
              <div className="mt-3 text-sm">
                <p className="text-foreground">{order.clients.name ?? order.clients.email}</p>
                {order.client_id && (
                  <Link
                    href={`/admin/clients/${order.client_id}`}
                    className="mt-1 inline-block text-accent underline underline-offset-4"
                  >
                    {clientOrderCount ?? 1} order{(clientOrderCount ?? 1) === 1 ? "" : "s"}
                  </Link>
                )}
                <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Contact information
                </h4>
                <p className="mt-1 text-foreground">{order.clients.email}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Guest {shipping?.name && `— ${shipping.name}`}
              </p>
            )}

            {shipping?.address && (
              <>
                <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Shipping address
                </h4>
                <p className="mt-1 text-sm text-foreground">
                  {shipping.name}
                  <br />
                  {shipping.address.line1}
                  {shipping.address.line2 ? `, ${shipping.address.line2}` : ""}
                  <br />
                  {shipping.address.city}, {shipping.address.state} {shipping.address.postal_code}
                  <br />
                  {shipping.address.country}
                </p>
              </>
            )}

            <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
              Billing address
            </h4>
            {billingAddress ? (
              <p className="mt-1 text-sm text-foreground">
                {billingAddress.line1}
                {billingAddress.line2 ? `, ${billingAddress.line2}` : ""}
                <br />
                {billingAddress.city}, {billingAddress.region} {billingAddress.postal_code}
                <br />
                {billingAddress.country}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Same as shipping address</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
