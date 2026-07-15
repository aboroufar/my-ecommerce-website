"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { cartLineKey } from "@/lib/cart-types";
import { createClient } from "@/lib/supabase/client";
import { OrderSummary } from "@/components/OrderSummary";

const DISCOUNT_STORAGE_KEY = "storefront:checkout-discount";

export default function CartPage() {
  const router = useRouter();
  const { items, subtotalCents, removeItem, setQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountCents: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  const currency = items[0]?.currency ?? "eur";
  const discountCents = appliedDiscount?.discountCents ?? 0;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
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
    // Signed-in shoppers see a review step (billing address + order
    // summary) before paying; guests have no saved billing address to
    // show there, so they keep going straight to Stripe as before.
    if (signedIn) {
      if (appliedDiscount) {
        sessionStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(appliedDiscount));
      } else {
        sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
      }
      router.push("/checkout/review");
      return;
    }

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

      <div className="mt-8">
        <OrderSummary
          subtotalCents={subtotalCents}
          discountCents={discountCents}
          discountCode={appliedDiscount?.code ?? null}
          currency={currency}
        />
      </div>

      <details className="mt-6 border border-line">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none">
          Discount code
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
        className="mt-6 w-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCheckingOut ? "Redirecting to checkout…" : "Checkout"}
      </button>
    </main>
  );
}
