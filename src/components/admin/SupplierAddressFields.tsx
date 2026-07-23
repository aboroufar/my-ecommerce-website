"use client";

import { useCallback, useState } from "react";
import { AddressAutocompleteInput } from "./AddressAutocompleteInput";

/**
 * Same address-fields pattern as DefaultAddressSection (client creation),
 * with field names matching suppliers.address_line1/postal_code/city/
 * province instead of the addresses table's client-facing columns.
 */
export function SupplierAddressFields({
  defaultCountry = "Italy",
  defaultLine1 = "",
  defaultLine2 = "",
  defaultPostalCode = "",
  defaultCity = "",
  defaultProvince = "",
}: {
  defaultCountry?: string;
  defaultLine1?: string;
  defaultLine2?: string;
  defaultPostalCode?: string;
  defaultCity?: string;
  defaultProvince?: string;
}) {
  const [line1, setLine1] = useState(defaultLine1);
  const [city, setCity] = useState(defaultCity);
  const [postalCode, setPostalCode] = useState(defaultPostalCode);
  const [province, setProvince] = useState(defaultProvince);
  const [country, setCountry] = useState(defaultCountry);

  const handleAddressSelect = useCallback(
    (fields: { line1: string; city: string; postalCode: string; region: string; country: string }) => {
      setLine1(fields.line1);
      setCity(fields.city);
      setPostalCode(fields.postalCode);
      setProvince(fields.region);
      if (fields.country) setCountry(fields.country);
    },
    []
  );

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground">Country/region</span>
        <input
          name="country"
          required
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
          defaultValue={defaultLine2}
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Postal code</span>
          <input
            name="postal_code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">City</span>
          <input
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Province</span>
          <input
            name="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
    </>
  );
}
