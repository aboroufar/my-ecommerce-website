import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface OrderItemThumbnail {
  id: string;
  product_name: string;
  products: {
    slug: string;
    product_images: { url: string; alt_text: string | null; sort_order: number }[];
  } | null;
}

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
    { key: "all", label: t("tabAll"), statuses: null },
    { key: "processing", label: t("tabProcessing"), statuses: ["pending", "paid"] },
    { key: "shipped", label: t("tabShipped"), statuses: ["fulfilled"] },
    { key: "returned", label: t("tabReturned"), statuses: ["refunded"] },
    { key: "cancelled", label: t("tabCancelled"), statuses: ["cancelled"] },
  ] as const;

  const activeTab = TABS.find((tab) => tab.key === status) ?? TABS[0];

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at")
    .order("created_at", { ascending: false });

  if (activeTab.statuses) {
    query = query.in("status", activeTab.statuses);
  }

  const { data: orders } = await query;

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

  const STATUS_LABELS: Record<string, string> = {
    pending: t("statusPending"),
    paid: t("statusPaid"),
    fulfilled: t("statusFulfilled"),
    cancelled: t("statusCancelled"),
    refunded: t("statusReturned"),
  };

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
                    <span>{STATUS_LABELS[order.status] ?? order.status}</span>
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
