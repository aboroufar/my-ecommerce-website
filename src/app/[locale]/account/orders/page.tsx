import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/format";
import type { FinancialStatus, FulfillmentStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface OrderItemThumbnail {
  id: string;
  product_name: string;
  products: {
    slug: string;
    product_images: { url: string; alt_text: string | null; sort_order: number }[];
  } | null;
}

interface OrderRow {
  id: string;
  financial_status: FinancialStatus;
  fulfillment_status: FulfillmentStatus;
  total_cents: number;
  currency: string;
  created_at: string;
}

// financial_status/fulfillment_status are two independent tracks (see
// 20260812000001_financial_fulfillment_status.sql), so each tab is a
// predicate over both fields rather than a plain .in("status", [...])
// list the old single-status query used -- filtered in-memory below,
// consistent with this page's existing client-side thumbnail-join style.
const TAB_PREDICATES: Record<string, (o: OrderRow) => boolean> = {
  processing: (o) => o.fulfillment_status !== "fulfilled" && o.fulfillment_status !== "cancelled",
  shipped: (o) => o.fulfillment_status === "fulfilled",
  returned: (o) => o.financial_status === "partially_refunded" || o.financial_status === "refunded",
  cancelled: (o) => o.fulfillment_status === "cancelled",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [t, locale] = await Promise.all([
    getTranslations("account"),
    getLocale(),
  ]);

  const TABS = [
    { key: "all", label: t("tabAll") },
    { key: "processing", label: t("tabProcessing") },
    { key: "shipped", label: t("tabShipped") },
    { key: "returned", label: t("tabReturned") },
    { key: "cancelled", label: t("tabCancelled") },
  ] as const;

  const activeTab = TABS.find((tab) => tab.key === status) ?? TABS[0];

  const supabase = await createClient();
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("id, financial_status, fulfillment_status, total_cents, currency, created_at")
    .order("created_at", { ascending: false });

  // financial_status/fulfillment_status are plain-text CHECK-constrained
  // columns, not real Postgres enums, so Supabase's generated type is
  // `string` -- cast to the hand-maintained literal unions, same
  // reasoning as OrderStatus elsewhere in this app.
  const allOrders = (rawOrders ?? []) as OrderRow[];
  const predicate = TAB_PREDICATES[activeTab.key];
  const orders = predicate ? allOrders.filter(predicate) : allOrders;

  // One thumbnail per order (the first line item's primary image), fetched
  // in a single batched query keyed by order id rather than N+1 per row.
  const orderIds = (orders ?? []).map((o) => o.id);
  const thumbnailsByOrder = new Map<string, OrderItemThumbnail>();
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("id, order_id, product_name, products(slug, product_images(url, alt_text, sort_order))")
      .in("order_id", orderIds);

    for (const item of (items ?? []) as unknown as (OrderItemThumbnail & { order_id: string })[]) {
      if (!thumbnailsByOrder.has(item.order_id)) {
        thumbnailsByOrder.set(item.order_id, item);
      }
    }
  }

  // Show the more customer-relevant status per row: a refund always
  // matters more than plain fulfillment progress, so financial_status
  // wins whenever it indicates a refund; otherwise fall back to
  // fulfillment_status -- recomposes what the old single-status display
  // showed, from the two now-independent fields.
  const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
    pending: t("statusPending"),
    paid: t("statusPaid"),
    partially_refunded: t("statusPartiallyRefunded"),
    refunded: t("statusReturned"),
    voided: t("statusVoided"),
  };
  const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
    unfulfilled: t("statusUnfulfilled"),
    partially_fulfilled: t("statusPartiallyFulfilled"),
    fulfilled: t("statusFulfilled"),
    cancelled: t("statusCancelled"),
  };
  function statusLabel(order: OrderRow) {
    if (order.financial_status !== "paid") {
      return FINANCIAL_STATUS_LABELS[order.financial_status];
    }
    return FULFILLMENT_STATUS_LABELS[order.fulfillment_status];
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">{t("orderHistory")}</h1>

      <div className="mt-6 flex gap-2 border-b border-line text-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/account/orders" : `/account/orders?status=${tab.key}`}
            className={`-mb-px border-b-2 px-1 pb-3 transition-colors ${
              activeTab.key === tab.key
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!orders || orders.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {activeTab.key === "all" ? (
            <>
              {t("noOrdersYet")}{" "}
              <Link
                href="/products"
                className="text-accent-text underline underline-offset-4"
              >
                {t("startShopping")}
              </Link>
              .
            </>
          ) : (
            t("noStatusOrders", { status: activeTab.label.toLowerCase() })
          )}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line">
          {orders.map((order) => {
            const thumbnail = thumbnailsByOrder.get(order.id);
            const image = thumbnail?.products?.product_images
              ? [...thumbnail.products.product_images].sort(
                  (a, b) => a.sort_order - b.sort_order
                )[0]
              : undefined;

            return (
              <li key={order.id} className="flex items-center gap-4 py-4">
                <Link
                  href={
                    thumbnail?.products?.slug
                      ? `/products/${thumbnail.products.slug}`
                      : `/account/orders/${order.id}`
                  }
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt_text ?? thumbnail?.product_name ?? ""}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-sm text-accent/40">
                      {(thumbnail?.product_name ?? "?").charAt(0)}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {t("orderNumber", { id: order.id.slice(0, 8) })}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(order.created_at, locale)} ·{" "}
                    <span>{statusLabel(order)}</span>
                  </p>
                </div>

                <span className="shrink-0 text-sm text-foreground">
                  {formatPrice(order.total_cents, order.currency, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
