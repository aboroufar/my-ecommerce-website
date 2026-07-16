"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { setBillingAddressInline, addAddressInline } from "@/lib/actions/addresses";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

const COUNTRIES = [{ code: "IT", label: "Italy" }];
const COUNTRY_LABELS: Record<string, string> = { IT: "Italy" };

interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  is_billing: boolean;
}

export default function CheckoutAddressPage() {
  const router = useRouter();
  const { items } = useCart();

  const [checking, setChecking] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const res = await fetch("/api/account/addresses");
      if (!res.ok) {
        router.replace("/cart");
        return;
      }
      const body = await res.json();
      const list: Address[] = body.addresses ?? [];
      setAddresses(list);
      const billing = list.find((a) => a.is_billing);
      setSelectedId(billing?.id ?? list[0]?.id ?? null);
      setShowAddForm(list.length === 0);
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddAddress(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await addAddressInline(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const res = await fetch("/api/account/addresses");
      const body = await res.json();
      const list: Address[] = body.addresses ?? [];
      setAddresses(list);
      const newest = list[0];
      setSelectedId(newest?.id ?? null);
      setShowAddForm(false);
    } catch {
      setError("Could not save that address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleContinue() {
    if (!selectedId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const selected = addresses.find((a) => a.id === selectedId);
      if (selected && !selected.is_billing) {
        const result = await setBillingAddressInline(selectedId);
        if (!result.success) {
          setError(result.error);
          return;
        }
      }
      router.push("/checkout/payment");
    } catch {
      setError("Could not save your address selection. Please try again.");
      setIsSubmitting(false);
    }
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
      <CheckoutSteps current="address" />

      <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-foreground">
        Choose your address
      </h1>

      {addresses.length > 0 && (
        <div className="mt-8 divide-y divide-line border-t border-b border-line">
          {addresses.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-start gap-3 py-4"
            >
              <input
                type="radio"
                name="address"
                className="mt-1"
                checked={selectedId === a.id}
                onChange={() => setSelectedId(a.id)}
              />
              <span className="text-sm text-foreground">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.postal_code} {a.city}
                {a.region ? `, ${a.region}` : ""}
                <br />
                {COUNTRY_LABELS[a.country] ?? a.country}
              </span>
            </label>
          ))}
        </div>
      )}

      {showAddForm ? (
        <form action={handleAddAddress} className="mt-6 flex flex-col gap-3">
          <input
            name="line1"
            required
            placeholder="Address line 1"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="line2"
            placeholder="Address line 2 (optional)"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="city"
              required
              placeholder="City"
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="region"
              placeholder="State / region"
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="postal_code"
              required
              placeholder="Postal code"
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
            <select
              name="country"
              required
              defaultValue={COUNTRIES[0].code}
              className="border border-line bg-transparent px-3 py-2 text-sm text-foreground"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="is_billing" value="on" />
          <div className="mt-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start bg-accent px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save address
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="mt-6 border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add new address
        </button>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {!showAddForm && (
        <button
          onClick={handleContinue}
          disabled={isSubmitting || !selectedId}
          className="mt-6 w-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      )}
    </main>
  );
}
