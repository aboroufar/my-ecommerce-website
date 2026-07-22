"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loadPromise: Promise<void> | null = null;

/**
 * Loads the Maps JS SDK (with the "places" library) exactly once per
 * page, however many AddressAutocompleteInput instances mount -- a
 * second injected <script> tag would fetch and re-register the library
 * twice. Once the script's onload fires, google.maps.importLibrary is
 * available and resolves immediately for a library already loaded via
 * the `libraries=` query param.
 */
function loadGoogleMapsPlaces(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.onload = () => {
      window.google!.maps.importLibrary("places").then(() => resolve(), reject);
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Wraps a text input with Google's current Places Autocomplete widget
 * (PlaceAutocompleteElement) once the SDK is available -- degrades to a
 * normal input (no crash, no blocked typing) if
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY isn't set or the script fails to load,
 * since a default address is optional on this form.
 *
 * The older google.maps.places.Autocomplete class (attached to a plain
 * <input>) is deprecated as of March 2025 and is not available to
 * projects created after that date -- new keys get InvalidKeyMapError
 * when trying to use it, regardless of billing/API-enablement/referrer
 * settings, which is why this uses PlaceAutocompleteElement instead.
 * That's a real custom element Google injects into the DOM, styled to
 * look like our own text input via CSS custom properties.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const domId = useId();

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) return;

    let element: google.maps.places.PlaceAutocompleteElement | null = null;
    let cancelled = false;

    loadGoogleMapsPlaces(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current || !window.google) return;
        const { PlaceAutocompleteElement } = (await window.google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        element = new PlaceAutocompleteElement({ includedPrimaryTypes: ["street_address", "premise", "route"] });
        element.id = domId;
        // The host element itself (not its shadow-DOM internals, which
        // Tailwind/CSS from this page can't reach) is a plain element we
        // can size directly.
        element.style.width = "100%";
        containerRef.current.appendChild(element);

        element.addEventListener("gmp-select", async (event) => {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ["addressComponents"] });
          const components = place.addressComponents ?? [];
          if (components.length === 0) return;

          const getPart = (type: string, useShort = false) => {
            const match = components.find((c) => c.types.includes(type));
            if (!match) return "";
            return (useShort ? match.shortText : match.longText) ?? "";
          };

          const streetNumber = getPart("street_number");
          const route = getPart("route");
          const line1 = [route, streetNumber].filter(Boolean).join(" ");

          if (hiddenInputRef.current) hiddenInputRef.current.value = line1;
          onChange(line1);
          onAddressSelect({
            line1,
            city: getPart("locality") || getPart("postal_town") || getPart("administrative_area_level_3"),
            postalCode: getPart("postal_code"),
            region: getPart("administrative_area_level_2", true),
            country: getPart("country"),
          });
        });

        setReady(true);
      })
      .catch((err) => {
        console.error("[AddressAutocomplete] failed to load Google Maps SDK:", err);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      element?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange/onAddressSelect are re-created every render by the parent; re-subscribing on every keystroke would tear down the widget mid-typing.
  }, []);

  return (
    <div className="relative">
      {/* Keeps `name`/`value` participating in the surrounding <form>'s
          FormData the same way a plain <input> would -- the real
          PlaceAutocompleteElement below doesn't submit as form data. */}
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={value} />
      {!failed && <div ref={containerRef} />}
      {(failed || !ready) && (
        <input
          defaultValue={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (hiddenInputRef.current) hiddenInputRef.current.value = e.target.value;
          }}
          placeholder={failed ? "Street and house number" : undefined}
          className="w-full border border-line bg-background px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
