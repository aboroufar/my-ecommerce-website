"use client";

import { useCallback, useState } from "react";
import { AddressAutocompleteInput } from "@/components/admin/AddressAutocompleteInput";

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

export function AddressForm({
  action,
  address,
  countries,
  submitLabel,
  cancelHref,
  cancelLabel,
  useAsBillingLabel,
  placeholders,
}: {
  action: (formData: FormData) => void;
  address?: Address;
  countries: { code: string; label: string }[];
  submitLabel: string;
  cancelHref?: string;
  cancelLabel?: string;
  useAsBillingLabel: string;
  placeholders: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
  };
}) {
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [region, setRegion] = useState(address?.region ?? "");
  const [postalCode, setPostalCode] = useState(address?.postal_code ?? "");
  const [country, setCountry] = useState(address?.country ?? countries[0].code);

  const handleAddressSelect = useCallback(
    (fields: { line1: string; city: string; postalCode: string; region: string; country: string }) => {
      setLine1(fields.line1);
      setCity(fields.city);
      setPostalCode(fields.postalCode);
      setRegion(fields.region);
      // Google's country component is a full ISO 3166-1 alpha-2 code
      // already, matching this app's country <select> values -- only
      // adopt it if it's actually one of the countries this form offers
      // (currently Italy-only), so a selection outside that list doesn't
      // silently produce an invalid/unlisted <select> value.
      if (countries.some((c) => c.code === fields.country)) {
        setCountry(fields.country);
      }
    },
    [countries]
  );

  return (
    <form action={action} className="mt-4 flex max-w-md flex-col gap-3">
      <AddressAutocompleteInput
        name="line1"
        value={line1}
        onChange={setLine1}
        onAddressSelect={handleAddressSelect}
      />
      <input
        name="line2"
        defaultValue={address?.line2 ?? ""}
        placeholder={placeholders.line2}
        className="border border-line bg-transparent px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={placeholders.city}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder={placeholders.region}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="postal_code"
          required
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder={placeholders.postalCode}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <select
          name="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-line bg-transparent px-3 py-2 text-sm text-foreground"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="is_billing" defaultChecked={address?.is_billing ?? false} />
        {useAsBillingLabel}
      </label>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="submit"
          className="self-start bg-accent px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {submitLabel}
        </button>
        {cancelHref && (
          <a
            href={cancelHref}
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            {cancelLabel}
          </a>
        )}
      </div>
    </form>
  );
}
