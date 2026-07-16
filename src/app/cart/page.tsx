"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice, getSaleInfo } from "@/lib/format";
import { cartLineKey } from "@/lib/cart-types";
import { createClient } from "@/lib/supabase/client";
import { OrderSummary } from "@/components/OrderSummary";
import { calculateShippingCents } from "@/lib/shipping";

const COUNTRY_LABELS: Record<string, string> = { IT: "Italy" };

interface BillingAddress {
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country: string;
}

export default function CartPage() {
  const { items, subtotalCents, removeItem, setQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<BillingAddress | null>(null);

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  const [shippingSettings, setShippingSettings] = useState({
    flatRateCents: 0,
    freeThresholdCents: 0,
  });

  const currency = items[0]?.currency ?? "eur";
  const discountCents = appliedDiscount?.discountCents ?? 0;
  const shippingCents = calculateShippingCents(
    subtotalCents,
    shippingSettings.flatRateCents,
    shippingSettings.freeThresholdCents
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setSignedIn(!!data.user);
      if (!data.user) return;
      const res = await fetch("/api/account/billing-summary");
      if (!res.ok) return;
      const body = await res.json();
      setName(body.name);
      setAddress(body.address);
    });
  }, []);

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

  async function handleApplyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountError(null);
    setIsValidatingDiscount(true);
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput.trim(), subtotalCents }),
      });
      const body = await res.json();
      if (!body.valid) {
        setDiscountError(body.error ?? "This code isn't valid.");
        setAppliedDiscount(null);
        return;
      }
      setAppliedDiscount({ code: body.code, discountCents: body.discountCents });
    } catch {
      setDiscountError("Could not check that code. Please try again.");
    } finally {
      setIsValidatingDiscount(false);
    }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError(null);
  }

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
          discountCode: appliedDiscount?.code,
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
          className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
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
          <ul className="mt-4 divide-y divide-line border-t border-b border-line">
            {items.map((item) => {
              const lineKey = cartLineKey(item);
              const sale = getSaleInfo(item.priceCents, item.compareAtPriceCents ?? null);
              return (
                <li key={lineKey} className="flex items-start gap-4 py-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-line bg-accent-soft">
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
                      <span className="mt-1 inline-block bg-sale px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
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
                          className="text-muted transition-colors hover:text-foreground"
                        >
                          <TrashIcon />
                        </button>
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            onClick={() => setQuantity(lineKey, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center text-sm text-foreground transition-opacity hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(lineKey, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center text-sm text-foreground transition-opacity hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
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

          {signedIn && (
            <div className="mt-8 border-t border-line">
              <div className="flex items-center justify-between border-b border-line py-4">
                <span className="text-sm font-medium text-foreground">Billing address</span>
                <Link
                  href="/account/addresses"
                  className="text-sm text-foreground underline underline-offset-4 hover:text-accent"
                >
                  Edit
                </Link>
              </div>
              <div className="py-4">
                {address ? (
                  <div className="text-sm text-foreground">
                    {name && <p>{name}</p>}
                    <p>
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p>
                      {address.postal_code} {address.city}
                      {address.region ? `, ${address.region}` : ""}
                    </p>
                    <p>{COUNTRY_LABELS[address.country] ?? address.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    No billing address on file.{" "}
                    <Link href="/account/addresses" className="underline underline-offset-4">
                      Add one
                    </Link>{" "}
                    before checking out.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-line bg-surface p-6">
            <OrderSummary
              subtotalCents={subtotalCents}
              discountCents={discountCents}
              discountCode={appliedDiscount?.code ?? null}
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
              className="mt-6 w-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingOut ? "Redirecting to payment…" : "Proceed to payment"}
            </button>

            <p className="mt-4 text-xs text-muted">
              Items in your cart are not reserved.
            </p>
          </div>

          <details className="mt-4 border border-line">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none">
              Redeem a discount code
            </summary>
            <div className="border-t border-line p-4">
              {appliedDiscount ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    <span className="font-medium">{appliedDiscount.code}</span> applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveDiscount}
                    className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 border border-line bg-transparent px-3 py-2 text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={isValidatingDiscount || !discountInput.trim()}
                    className="border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isValidatingDiscount ? "Checking…" : "Apply"}
                  </button>
                </div>
              )}
              {discountError && (
                <p className="mt-2 text-xs text-red-700">{discountError}</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </main>
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
