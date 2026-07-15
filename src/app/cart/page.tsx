"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { cartLineKey } from "@/lib/cart-types";

export default function CartPage() {
  const { items, subtotalCents, removeItem, setQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
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
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="font-display text-2xl text-foreground">Your cart</h1>

      <ul className="mt-8 divide-y divide-line">
        {items.map((item) => {
          const lineKey = cartLineKey(item);
          return (
            <li key={lineKey} className="flex items-center gap-4 py-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden bg-accent-soft">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-lg text-accent/40">
                    {item.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm text-foreground hover:underline"
                >
                  {item.name}
                </Link>
                {item.variantLabel && (
                  <p className="mt-0.5 text-xs text-muted">{item.variantLabel}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {formatPrice(item.priceCents, item.currency)} each
                </p>

                <div className="mt-2 flex items-center gap-3">
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
                  <button
                    onClick={() => removeItem(lineKey)}
                    className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="text-sm text-foreground">
                {formatPrice(item.priceCents * item.quantity, item.currency)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        <span className="text-sm text-muted">Subtotal</span>
        <span className="font-display text-xl text-foreground">
          {formatPrice(subtotalCents, items[0]?.currency ?? "eur")}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Shipping and taxes calculated at checkout.
      </p>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={isCheckingOut}
        className="mt-6 w-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCheckingOut ? "Redirecting to checkout…" : "Checkout"}
      </button>
    </main>
  );
}
