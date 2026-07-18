"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatPrice } from "@/lib/format";

export function OrderSummary({
  subtotalCents,
  discountCents,
  discountCode,
  shippingCents,
  currency,
}: {
  subtotalCents: number;
  discountCents: number;
  discountCode: string | null;
  shippingCents: number;
  currency: string;
}) {
  const t = useTranslations("orderSummary");
  const locale = useLocale();
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  return (
    <div className="border-t border-line pt-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{t("subtotal")}</span>
        <span className="text-sm text-foreground">
          {formatPrice(subtotalCents, currency, locale)}
        </span>
      </div>

      {discountCents > 0 && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted">
            {t("discount")}{discountCode ? ` (${discountCode})` : ""}
          </span>
          <span className="text-sm text-foreground">
            −{formatPrice(discountCents, currency, locale)}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-muted">{t("shipping")}</span>
        <span className="text-sm text-foreground">
          {shippingCents > 0 ? formatPrice(shippingCents, currency, locale) : t("free")}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
        <span className="text-sm text-foreground">{t("total")}</span>
        <span className="font-display text-xl text-foreground">
          {formatPrice(totalCents, currency, locale)}
        </span>
      </div>
      <p className="mt-1 text-right text-xs text-muted">{t("vatIncluded")}</p>
    </div>
  );
}
