"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { OrderSummary } from "@/components/OrderSummary";
import { calculateShippingCents } from "@/lib/shipping";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

const DISCOUNT_STORAGE_KEY = "storefront:checkout-discount";
const PAYMENT_METHOD_STORAGE_KEY = "storefront:checkout-payment-method";
const COUNTRY_LABELS: Record<string, string> = { IT: "Italy" };

const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  klarna: "Klarna",
  satispay: "Satispay",
  paypal: "PayPal",
};

interface BillingAddress {
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country: string;
}

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { items, subtotalCents } = useCart();

  const [checking, setChecking] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<BillingAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    const storedDiscount = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
    if (storedDiscount) {
      try {
        setAppliedDiscount(JSON.parse(storedDiscount));
      } catch {
        // ignore malformed stored value
      }
    }
    const storedMethod = sessionStorage.getItem(PAYMENT_METHOD_STORAGE_KEY);
    if (storedMethod) setPaymentMethod(storedMethod);
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

  useEffect(() => {
    let cartIsEmpty = true;
    try {
      const raw = localStorage.getItem("storefront:cart");
      cartIsEmpty = !raw || JSON.parse(raw).length === 0;
    } catch {
      cartIsEmpty = true;
    }
    if (cartIsEmpty) {
      router.replace("/cart");
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/cart");
        return;
      }

      const res = await fetch("/api/account/billing-summary");
      if (!res.ok) {
        router.replace("/cart");
        return;
      }
      const body = await res.json();
      setName(body.name);
      setAddress(body.address);
      setChecking(false);
    });
    // Only needs to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProceed() {
    setError(null);
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
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Checkout failed. Please try again.");
      }

      sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
      sessionStorage.removeItem(PAYMENT_METHOD_STORAGE_KEY);
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setIsCheckingOut(false);
    }
  }

  if (checking) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <CheckoutSteps current="review" />

      <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-foreground">
        Check your order
      </h1>

      <div className="mt-8 border-t border-line">
        <div className="flex items-center justify-between border-b border-line py-4">
          <span className="text-sm font-medium text-foreground">Billing address</span>
          <Link
            href="/checkout/address"
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
              <Link href="/checkout/address" className="underline underline-offset-4">
                Add one
              </Link>{" "}
              to continue.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="flex items-center justify-between border-b border-line py-4">
          <span className="text-sm font-medium text-foreground">Payment method</span>
          <Link
            href="/checkout/payment"
            className="text-sm text-foreground underline underline-offset-4 hover:text-accent"
          >
            Edit
          </Link>
        </div>
        <div className="py-4">
          <p className="text-sm text-foreground">
            {METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <OrderSummary
          subtotalCents={subtotalCents}
          discountCents={appliedDiscount?.discountCents ?? 0}
          discountCode={appliedDiscount?.code ?? null}
          shippingCents={shippingCents}
          currency={currency}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        onClick={handleProceed}
        disabled={isCheckingOut || !address}
        className="mt-6 w-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCheckingOut ? "Redirecting to payment…" : "Pay now"}
      </button>
    </main>
  );
}
