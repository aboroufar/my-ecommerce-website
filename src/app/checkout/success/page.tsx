"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

function CheckoutSuccessContent() {
  const { clear } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  // Clear the cart once, on arrival -- payment is confirmed at this point
  // (Stripe redirected here only after a successful Checkout Session).
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-20 text-center">
      <h1 className="font-display text-3xl text-foreground">
        Thank you — order confirmed.
      </h1>
      <p className="mt-3 text-sm text-muted">
        A confirmation email is on its way. We&apos;ll let you know once it
        ships.
      </p>
      {orderId && (
        <p className="mt-6 text-xs text-muted">
          Order reference: <span className="font-mono">{orderId}</span>
        </p>
      )}
      <Link
        href="/products"
        className="mt-8 inline-block bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Continue shopping
      </Link>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
