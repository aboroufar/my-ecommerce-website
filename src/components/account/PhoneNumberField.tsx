"use client";

import { useState } from "react";

/**
 * Fixed-prefix phone input -- only Italy (+39) for now, matching the
 * single-market shipping/address constraints already elsewhere in this
 * app. The visible input only takes the national number; the hidden
 * "phone" field (what completeProfile's action actually reads) carries
 * the concatenated "+39 <number>" so the stored value stays a single
 * plain string, same shape phone already has everywhere else in this
 * codebase -- no schema change needed.
 */
export function PhoneNumberField({
  defaultValue = "",
  placeholder,
}: {
  defaultValue?: string;
  placeholder: string;
}) {
  // If an existing phone value already starts with "+39 ", strip it so
  // the visible input shows just the national number, not a doubled
  // prefix, when editing a profile that was saved with this same field.
  const initialNumber = defaultValue.startsWith("+39 ")
    ? defaultValue.slice(4)
    : defaultValue;
  const [number, setNumber] = useState(initialNumber);

  return (
    <div className="flex gap-2">
      <input type="hidden" name="phone" value={number ? `+39 ${number}` : ""} />
      <span className="flex shrink-0 items-center border border-line bg-transparent px-3 py-2 text-sm text-foreground">
        🇮🇹 +39
      </span>
      <input
        type="tel"
        required
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-line bg-transparent px-3 py-2 text-sm"
      />
    </div>
  );
}
