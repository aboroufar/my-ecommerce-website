"use client";

import { useCallback, useState } from "react";
import { AddressAutocompleteInput } from "./AddressAutocompleteInput";

export function DefaultAddressSection() {
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
      <p className="mt-2 text-sm text-muted">Optional -- leave blank to add later.</p>

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
      </div>
    </section>
  );
}
