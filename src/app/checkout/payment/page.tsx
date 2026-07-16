"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import {
  VisaIcon,
  MastercardIcon,
  AmexIcon,
  KlarnaIcon,
  SatispayIcon,
  PaypalIcon,
} from "@/components/PaymentIcons";

const PAYMENT_METHOD_STORAGE_KEY = "storefront:checkout-payment-method";

const METHODS = [
  { key: "card", label: "Card" },
  { key: "klarna", label: "Klarna" },
  { key: "satispay", label: "Satispay" },
  { key: "paypal", label: "PayPal" },
] as const;

type PaymentMethod = (typeof METHODS)[number]["key"];

function MethodIcons({ method }: { method: PaymentMethod }) {
  if (method === "card") {
    return (
      <span className="flex items-center gap-1.5">
        <VisaIcon />
        <MastercardIcon />
        <AmexIcon />
      </span>
    );
  }
  if (method === "klarna") return <KlarnaIcon />;
  if (method === "satispay") return <SatispayIcon />;
  return <PaypalIcon />;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { items } = useCart();

  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<PaymentMethod>("card");

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
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/cart");
        return;
      }
      const stored = sessionStorage.getItem(PAYMENT_METHOD_STORAGE_KEY);
      if (stored && METHODS.some((m) => m.key === stored)) {
        setSelected(stored as PaymentMethod);
      }
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleContinue() {
    sessionStorage.setItem(PAYMENT_METHOD_STORAGE_KEY, selected);
    router.push("/checkout/review");
  }

  if (checking) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    );
  }

  if (items.length === 0) return null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <CheckoutSteps current="payment" />

      <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-foreground">
        Choose your payment method
      </h1>

      <div className="mt-8 divide-y divide-line border-t border-b border-line">
        {METHODS.map((m) => (
          <label
            key={m.key}
            className="flex cursor-pointer items-center justify-between gap-3 py-4"
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                checked={selected === m.key}
                onChange={() => setSelected(m.key)}
              />
              <span className="text-sm text-foreground">{m.label}</span>
            </span>
            <MethodIcons method={m.key} />
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Link
          href="/checkout/address"
          className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
        >
          Back
        </Link>
      </div>

      <button
        onClick={handleContinue}
        className="mt-6 w-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Continue
      </button>
    </main>
  );
}
