"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice, getSaleInfo } from "@/lib/format";
import { cartLineKey } from "@/lib/cart-types";
import { calculateShippingCents } from "@/lib/shipping";

export default function CartPage() {
  const t = useTranslations("cart");
  const tOrder = useTranslations("orderSummary");
  const locale = useLocale();
  const { items, subtotalCents, removeItem, setQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState("");

  const [shippingSettings, setShippingSettings] = useState({
    flatRateCents: 0,
    freeThresholdCents: 0,
  });

  const currency = items[0]?.currency ?? "eur";
  const shippingCents = calculateShippingCents(
    subtotalCents,
    shippingSettings.flatRateCents,
    shippingSettings.freeThresholdCents
  );
  // Original (pre-discount) subtotal, for the sticky bar's struck-through
  // price -- sums each line's compare-at price when on sale, its regular
  // price otherwise, so the crossed-out total reflects real savings.
  const originalSubtotalCents = items.reduce((sum, item) => {
    const sale = getSaleInfo(item.priceCents, item.compareAtPriceCents ?? null);
    const unitOriginal = sale.onSale ? item.compareAtPriceCents! : item.priceCents;
    return sum + unitOriginal * item.quantity;
  }, 0);
  const discountCents = Math.max(0, originalSubtotalCents - subtotalCents);
  const totalCents = subtotalCents + shippingCents;
  const originalTotalCents = originalSubtotalCents + shippingCents;

  useEffect(() => {
    fetch("/api/site-settings/shipping")
      .then((res) => res.json())
      .then((body) =>
        setShippingSettings({
          flatRateCents: body.shippingFlatRateCents,
          freeThresholdCents: body.freeShippingThresholdCents,
        })
      )
      .catch(() => {});
  }, []);

  async function handleCheckout() {
    setError(null);
    setProfileIncomplete(false);
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          discountCode: discountCodeInput.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "PROFILE_INCOMPLETE") {
          setProfileIncomplete(true);
        }
        throw new Error(body.error ?? t("checkoutFailedGeneric"));
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkoutFailed"));
      setIsCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-foreground">
          {t("empty")}
        </h1>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm text-accent-text underline underline-offset-4"
        >
          {t("continueShopping")}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-accent-soft">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-40 sm:px-6">
        <h1 className="font-display text-2xl text-foreground">{t("title")}</h1>

        <ul className="mt-6 flex flex-col gap-4" aria-live="polite">
          {items.map((item) => {
            const lineKey = cartLineKey(item);
            const sale = getSaleInfo(item.priceCents, item.compareAtPriceCents ?? null);
            return (
              <li
                key={lineKey}
                className="flex gap-4 rounded-2xl bg-surface p-4 shadow-sm"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-lg text-accent/40">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-display text-base font-medium text-foreground hover:underline"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeItem(lineKey)}
                      aria-label={t("removeItem", { name: item.name })}
                      className="shrink-0 rounded text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  {item.variantLabel && (
                    <p className="mt-0.5 text-sm text-muted">{item.variantLabel}</p>
                  )}
                  {sale.onSale && (
                    <span className="mt-1 w-fit rounded-full bg-sale px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                      {t("specialPrice")}
                    </span>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div>
                      {sale.onSale && (
                        <p className="text-sm text-muted line-through">
                          {formatPrice(item.compareAtPriceCents!, item.currency, locale)}
                        </p>
                      )}
                      <p className="font-display text-lg font-semibold text-foreground">
                        {formatPrice(item.priceCents, item.currency, locale)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(lineKey, item.quantity + 1)}
                        aria-label={t("increaseQuantity", { name: item.name })}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-foreground transition-colors hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <PlusIcon />
                      </button>
                      <span
                        className="w-4 text-center text-sm font-medium text-foreground"
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(lineKey, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={t("decreaseQuantity", { name: item.name })}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-foreground transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <MinusIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex gap-2">
          <input
            type="text"
            value={discountCodeInput}
            onChange={(e) => setDiscountCodeInput(e.target.value)}
            placeholder={t("discountCodePlaceholder")}
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm uppercase text-foreground"
          />
        </div>

        <div className="mt-4 rounded-2xl bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{tOrder("shipping")}:</span>
            <span className="font-medium text-foreground">
              {shippingCents > 0 ? formatPrice(shippingCents, currency, locale) : tOrder("free")}
            </span>
          </div>
          {discountCents > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm text-muted">
              <span>{tOrder("discount")}:</span>
              <span className="font-medium text-foreground">
                {formatPrice(discountCents, currency, locale)}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-sm text-muted">
            <span>{tOrder("total")}:</span>
            <span className="font-medium text-foreground">
              {formatPrice(originalTotalCents, currency, locale)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="font-display text-lg font-semibold text-foreground">
              {tOrder("subtotal")}:
            </span>
            <span className="font-display text-2xl font-bold text-foreground">
              {formatPrice(totalCents, currency, locale)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-700">
            {error}
            {profileIncomplete && (
              <>
                {" "}
                <Link href="/account" className="underline underline-offset-4">
                  {t("updateYourProfile")}
                </Link>
                .
              </>
            )}
          </p>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          {t("notReservedNotice")}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-foreground px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          <div className="leading-tight">
            {discountCents > 0 && (
              <p className="text-sm text-background/60 line-through">
                {formatPrice(originalTotalCents, currency, locale)}
              </p>
            )}
            <p className="font-display text-xl font-bold text-background">
              {formatPrice(totalCents, currency, locale)}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            aria-live="polite"
            className="flex-1 max-w-[220px] rounded-full bg-background px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCheckingOut ? t("redirectingToPayment") : t("checkout")}
          </button>
        </div>
      </div>
    </main>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
