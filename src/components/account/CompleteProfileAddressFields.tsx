"use client";

import { useCallback, useState } from "react";
import { AddressAutocompleteInput } from "@/components/admin/AddressAutocompleteInput";

export function CompleteProfileAddressFields({
  countryLabel,
  countryValue,
  line1Placeholder,
  line2Placeholder,
  cityPlaceholder,
  regionPlaceholder,
  postalCodePlaceholder,
}: {
  countryLabel: string;
  countryValue: string;
  line1Placeholder: string;
  line2Placeholder: string;
  cityPlaceholder: string;
  regionPlaceholder: string;
  postalCodePlaceholder: string;
}) {
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [region, setRegion] = useState("");

  const handleAddressSelect = useCallback(
    (fields: { line1: string; city: string; postalCode: string; region: string }) => {
      setLine1(fields.line1);
      setCity(fields.city);
      setPostalCode(fields.postalCode);
      setRegion(fields.region);
    },
    []
  );

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="address_country" value={countryValue} />
      <span className="text-xs text-muted">{countryLabel}</span>

      <AddressAutocompleteInput
        name="address_line1"
        value={line1}
        onChange={setLine1}
        onAddressSelect={handleAddressSelect}
      />
      <input
        name="address_line2"
        placeholder={line2Placeholder}
        className="border border-line bg-transparent px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="address_city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={cityPlaceholder}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="address_region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder={regionPlaceholder}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <input
        name="address_postal_code"
        value={postalCode}
        onChange={(e) => setPostalCode(e.target.value)}
        placeholder={postalCodePlaceholder}
        className="border border-line bg-transparent px-3 py-2 text-sm"
      />
    </div>
  );
}
