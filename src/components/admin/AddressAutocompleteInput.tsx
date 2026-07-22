"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsCallback?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;

/**
 * Loads the Maps JS SDK's places library exactly once per page, however
 * many AddressAutocompleteInput instances mount -- a second <script> tag
 * with the same callback name would silently race and only one caller's
 * promise would ever resolve.
 */
function loadGoogleMapsPlaces(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    window.__googleMapsCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsCallback`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  useShortName = false
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  return useShortName ? match.short_name : match.long_name;
}

/**
 * Wraps a text input with Google Places Autocomplete once the SDK is
 * available -- degrades to a normal input (no crash, no blocked typing)
 * if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY isn't set or the script fails to
 * load, since a default address is optional on this form.
 *
 * Not a fully React-controlled input: the Autocomplete widget writes
 * directly into the DOM node's value on selection, which a strict
 * value={...} prop would fight over re-render. Instead `value` only
 * seeds/resyncs the field when it changes externally (e.g. cleared by
 * the parent), and every keystroke/selection reports back via onChange.
 */
export function AddressAutocompleteInput({
  name,
  value,
  onChange,
  onAddressSelect,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (fields: {
    line1: string;
    city: string;
    postalCode: string;
    region: string;
    country: string;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    loadGoogleMapsPlaces(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete!.getPlace();
          const components = place.address_components ?? [];
          if (components.length === 0) return;

          const streetNumber = getComponent(components, "street_number");
          const route = getComponent(components, "route");
          const line1 = [route, streetNumber].filter(Boolean).join(" ") || (inputRef.current?.value ?? "");

          onChange(line1);
          onAddressSelect({
            line1,
            city:
              getComponent(components, "locality") ||
              getComponent(components, "postal_town") ||
              getComponent(components, "administrative_area_level_3"),
            postalCode: getComponent(components, "postal_code"),
            region: getComponent(components, "administrative_area_level_2", true),
            country: getComponent(components, "country"),
          });
        });
        setReady(true);
      })
      .catch((err) => {
        console.error("[AddressAutocomplete] failed to load Google Maps SDK:", err);
      });

    return () => {
      cancelled = true;
      if (autocomplete) window.google?.maps.event.clearInstanceListeners(autocomplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange/onAddressSelect are re-created every render by the parent; re-subscribing on every keystroke would tear down the widget mid-typing.
  }, []);

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        name={name}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        placeholder={ready ? "Start typing an address…" : undefined}
        className="w-full border border-line bg-background py-2 pl-9 pr-3 text-sm"
      />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
