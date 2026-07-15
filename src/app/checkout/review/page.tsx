"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { OrderSummary } from "@/components/OrderSummary";
import { formatPrice } from "@/lib/format";

const DISCOUNT_STORAGE_KEY = "storefront:checkout-discount";
const COUNTRY_LABELS: Record<string, string> = { IT: "Italy" };

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
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = items[0]?.currency ?? "eur";

  useEffect(() => {
    const stored = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
    if (stored) {
      try {
        setAppliedDiscount(JSON.parse(stored));
      } catch {
        // ignore malformed stored value
      }
    }
  }, []);

  useEffect(() => {
    // CartProvider hydrates its items from localStorage in its own
    // mount-time effect, so `items` from useCart() can still be empty on
    // this page's very first render even when a cart actually exists.
    // Reading localStorage directly here avoids redirecting away from a
    // non-empty cart just because of that hydration race.
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
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Checkout failed. Please try again.");
      }

      sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
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
      <h1 className="font-display text-2xl uppercase tracking-wide text-foreground">
        Check your order
      </h1>

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
              to continue.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="flex items-center justify-between border-b border-line py-4">
          <span className="text-sm font-medium text-foreground">Payment method</span>
        </div>
        <div className="py-4">
          <p className="text-sm text-muted">
            Card, Klarna, Satispay, or PayPal — choose on the next step.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <OrderSummary
          subtotalCents={subtotalCents}
          discountCents={appliedDiscount?.discountCents ?? 0}
          discountCode={appliedDiscount?.code ?? null}
          currency={currency}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        onClick={handleProceed}
        disabled={isCheckingOut || !address}
        className="mt-6 w-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCheckingOut ? "Redirecting to payment…" : "Proceed to payment"}
      </button>

      <p className="mt-4 text-xs text-muted">
        {formatPrice(subtotalCents, currency)} subtotal · Payment is completed securely on Stripe.
      </p>
    </main>
  );
}
