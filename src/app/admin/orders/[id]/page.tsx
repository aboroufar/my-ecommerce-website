import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@/lib/supabase/types";

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

const statusOptions: OrderStatus[] = [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
];

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
      "id, status, total_cents, currency, created_at, shipping_address, stripe_payment_intent_id, customers(email)"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, unit_price_cents")
    .eq("order_id", id);

  const shipping = order.shipping_address as ShippingAddress | null;
  const updateStatusWithId = updateOrderStatus.bind(null, id);

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
            {order.customers?.email ?? "Guest"}
          </p>
        </div>
        <span className="border border-line px-3 py-1 text-xs font-medium uppercase tracking-wide text-foreground">
          {order.status}
        </span>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-8 divide-y divide-line">
        {(items ?? []).map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between py-3 text-sm"
          >
            <span className="text-foreground">
              {item.product_name} × {item.quantity}
            </span>
            <span className="text-foreground">
              {formatPrice(item.unit_price_cents * item.quantity, order.currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">Total</span>
        <span className="font-display text-xl text-foreground">
          {formatPrice(order.total_cents, order.currency)}
        </span>
      </div>

      {shipping?.address && (
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Shipping address
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {shipping.name}
            <br />
            {shipping.address.line1}
            {shipping.address.line2 ? `, ${shipping.address.line2}` : ""}
            <br />
            {shipping.address.city}, {shipping.address.state}{" "}
            {shipping.address.postal_code}
            <br />
            {shipping.address.country}
          </p>
        </div>
      )}

      {order.stripe_payment_intent_id && (
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Payment
          </h2>
          <a
            href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-accent underline underline-offset-4"
          >
            View payment in Stripe →
          </a>
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Update status
        </h2>
        <form action={updateStatusWithId} className="mt-3 flex items-center gap-3">
          <select
            name="status"
            defaultValue={order.status}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
