"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice, getSaleInfo } from "@/lib/format";
import { cartLineKey } from "@/lib/cart-types";
import { OrderSummary } from "@/components/OrderSummary";
import { calculateShippingCents } from "@/lib/shipping";
import { PaymentIcons } from "@/components/PaymentIcons";

export default function CartPage() {
  const { items, subtotalCents, removeItem, setQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

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
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "PROFILE_INCOMPLETE") {
          setProfileIncomplete(true);
        }
        throw new Error(body.error ?? "Checkout failed. Please try again.");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setIsCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-foreground">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm text-accent-text underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="font-display text-2xl text-foreground">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Your items
          </h2>
          <ul
            className="mt-4 divide-y divide-line border-t border-b border-line"
            aria-live="polite"
          >
            {items.map((item) => {
              const lineKey = cartLineKey(item);
              const sale = getSaleInfo(item.priceCents, item.compareAtPriceCents ?? null);
              return (
                <li key={lineKey} className="flex items-start gap-4 py-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden bg-accent-soft">
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

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-display text-base font-bold text-foreground hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel && (
                          <p className="mt-0.5 text-xs text-muted">{item.variantLabel}</p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {sale.onSale && (
                          <p className="text-xs text-muted line-through">
                            {formatPrice(item.compareAtPriceCents!, item.currency)}
                          </p>
                        )}
                        <p className="text-sm font-bold text-foreground">
                          {formatPrice(item.priceCents, item.currency)}
                        </p>
                      </div>
                    </div>

                    {sale.onSale && (
                      <span className="mt-1 inline-block rounded-full bg-sale px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                        Special price
                      </span>
                    )}

                    <p className="mt-2 text-xs text-muted">
                      Ships within 2–3 business days
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeItem(lineKey)}
                          aria-label={`Remove ${item.name}`}
                          className="rounded text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <TrashIcon />
                        </button>
                        <div className="flex items-center overflow-hidden rounded-full border border-line">
                          <button
                            type="button"
                            onClick={() => setQuantity(lineKey, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center text-sm text-foreground transition-opacity hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs text-foreground" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(lineKey, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center text-sm text-foreground transition-opacity hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-foreground">
                        {formatPrice(item.priceCents * item.quantity, item.currency)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-6">
            <OrderSummary
              subtotalCents={subtotalCents}
              discountCents={0}
              discountCode={null}
              shippingCents={shippingCents}
              currency={currency}
            />

            {error && (
              <p className="mt-4 text-sm text-red-700">
                {error}
                {profileIncomplete && (
                  <>
                    {" "}
                    <Link href="/account" className="underline underline-offset-4">
                      Update your profile
                    </Link>
                    .
                  </>
                )}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              aria-live="polite"
              className="mt-6 w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-background transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {isCheckingOut ? "Redirecting to payment…" : "Proceed to payment"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <LockIcon />
              Secure checkout
            </div>
            <div className="mt-3">
              <PaymentIcons />
            </div>

            <p className="mt-4 text-xs text-muted">
              Items in your cart are not reserved. You can enter a discount code on the payment page.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
