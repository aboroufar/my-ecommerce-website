"use client";

import { useCallback, useState } from "react";
import { AddressAutocompleteInput } from "./AddressAutocompleteInput";

/**
 * Collapsed behind a single "Add address" row by default, matching
 * Shopify's own new-customer form -- the address fields only render once
 * clicked, since a default address is optional and most of this form's
 * required fields (name, email) sit above it.
 */
export function DefaultAddressSection() {
  const [expanded, setExpanded] = useState(false);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("Italy");

  const handleAddressSelect = useCallback(
    (fields: { line1: string; city: string; postalCode: string; region: string; country: string }) => {
      setLine1(fields.line1);
      setCity(fields.city);
      setPostalCode(fields.postalCode);
      setRegion(fields.region);
      if (fields.country) setCountry(fields.country);
    },
    []
  );

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Default address</h2>
      <p className="mt-2 text-sm text-muted">The primary address of this client.</p>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 flex w-full items-center justify-between border border-line bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-foreground"
        >
          <span className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add address
          </span>
          <ChevronIcon className="h-4 w-4 text-muted" />
        </button>
      ) : (
        <div className="mt-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Country/region</span>
            <input
              name="address_country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Street and house number</span>
            <AddressAutocompleteInput
              name="address_line1"
              value={line1}
              onChange={setLine1}
              onAddressSelect={handleAddressSelect}
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Apartment, suite, etc</span>
            <input
              name="address_line2"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Postal code</span>
              <input
                name="address_postal_code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">City</span>
              <input
                name="address_city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Province</span>
              <input
                name="address_region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-3 text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Remove address
          </button>
        </div>
      )}
    </section>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
