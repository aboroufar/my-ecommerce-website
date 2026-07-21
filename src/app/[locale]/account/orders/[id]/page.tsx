import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/format";

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supabase, t, locale] = await Promise.all([
    createClient(),
    getTranslations("account"),
    getLocale(),
  ]);

  // RLS ("Clients can view own orders") means this returns null for any
  // order that isn't the logged-in user's -- no manual ownership check needed.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, currency, created_at, shipping_address, carrier, tracking_number, tracking_url"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, product_name, quantity, unit_price_cents, variant_label, products(slug, product_images(url, alt_text, sort_order))"
    )
    .eq("order_id", id);

  const shipping = order.shipping_address as ShippingAddress | null;

  const STATUS_LABELS: Record<string, string> = {
    pending: t("statusPending"),
    paid: t("statusPaid"),
    fulfilled: t("statusFulfilled"),
    cancelled: t("statusCancelled"),
    refunded: t("statusReturned"),
  };

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        {t("backToOrderHistory")}
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">
        {t("orderNumber", { id: order.id.slice(0, 8) })}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {t("placed")} {formatDate(order.created_at, locale)} ·{" "}
        <span>{STATUS_LABELS[order.status] ?? order.status}</span>
      </p>

      <ul className="mt-8 divide-y divide-line">
        {(items ?? []).map((item) => {
          const image = item.products?.product_images
            ? [...item.products.product_images].sort(
                (a, b) => a.sort_order - b.sort_order
              )[0]
            : undefined;
          const thumbnail = (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
              {image ? (
                <Image
                  src={image.url}
                  alt={image.alt_text ?? item.product_name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-sm text-accent/40">
                  {item.product_name.charAt(0)}
                </div>
              )}
            </div>
          );

          return (
            <li key={item.id} className="flex items-center gap-4 py-3 text-sm">
              {item.products?.slug ? (
                <Link href={`/products/${item.products.slug}`} className="shrink-0">
                  {thumbnail}
                </Link>
              ) : (
                thumbnail
              )}

              <div className="min-w-0 flex-1">
                <span className="text-foreground">
                  {item.product_name} × {item.quantity}
                </span>
                {item.variant_label && (
                  <p className="mt-0.5 text-xs text-muted">{item.variant_label}</p>
                )}
              </div>

              <span className="shrink-0 text-foreground">
                {formatPrice(item.unit_price_cents * item.quantity, order.currency, locale)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">{t("total")}</span>
        <span className="font-display text-xl text-foreground">
          {formatPrice(order.total_cents, order.currency, locale)}
        </span>
      </div>

      {shipping?.address && (
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("shippingAddress")}
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

      {order.tracking_number && (
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("tracking")}
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {order.carrier} · {order.tracking_number}
          </p>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-accent underline underline-offset-4"
            >
              {t("trackShipment")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
