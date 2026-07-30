import { getLocale, getTranslations } from "next-intl/server";
import { computeDeliveryEstimate, type DeliveryEstimateSettings } from "@/lib/deliveryEstimate";
import { formatDate } from "@/lib/format";

export async function EstimatedDelivery({ settings }: { settings: DeliveryEstimateSettings }) {
  const estimate = computeDeliveryEstimate(settings);
  if (!estimate) return null;

  const [locale, t] = await Promise.all([getLocale(), getTranslations("estimatedDelivery")]);
  const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  return (
    <p className="mt-3 text-sm text-muted">
      {t("label")}{" "}
      <span className="font-medium text-foreground">
        {formatDate(estimate.earliest, locale, dateOptions)} –{" "}
        {formatDate(estimate.latest, locale, dateOptions)}
      </span>
    </p>
  );
}
