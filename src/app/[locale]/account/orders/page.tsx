import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

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
    { key: "cancelled", label: t("tabCancelled"), statuses: ["cancelled", "refunded"] },
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

  const STATUS_LABELS: Record<string, string> = {
    pending: t("statusPending"),
    paid: t("statusPaid"),
    fulfilled: t("statusFulfilled"),
    cancelled: t("statusCancelled"),
    refunded: t("statusRefunded"),
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
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between py-4">
              <div>
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
              <span className="text-sm text-foreground">
                {formatPrice(order.total_cents, order.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
