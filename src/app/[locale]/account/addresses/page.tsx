import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  setBillingAddress,
} from "@/lib/actions/addresses";
import { AddressForm } from "@/components/account/AddressForm";

export const dynamic = "force-dynamic";

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

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const { error, edit } = await searchParams;
  const [supabase, t, tc] = await Promise.all([
    createClient(),
    getTranslations("account"),
    getTranslations("common"),
  ]);

  // Matches the countries Stripe Checkout is configured to accept
  // (shipping_address_collection.allowed_countries in the checkout route) --
  // a free-text field can't reliably produce the ISO codes Stripe needs for
  // shipping-address pre-fill to work. Shipping is Italy-only for now.
  const COUNTRIES = [{ code: "IT", label: t("countryItaly") }];

  const { data: addresses } = await supabase
    .from("addresses")
    .select(
      "id, line1, line2, city, region, postal_code, country, is_default, is_billing"
    )
    .order("created_at", { ascending: false });

  const editing = edit ? (addresses ?? []).find((a) => a.id === edit) : null;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        {t("savedAddresses")}
      </h1>

      {error && (
        <p className="mt-6 max-w-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {addresses && addresses.length > 0 && (
        <ul className="mt-8 divide-y divide-line">
          {addresses.map((a) =>
            editing && editing.id === a.id ? (
              <li key={a.id} className="py-4">
                <AddressForm
                  action={updateAddress.bind(null, a.id)}
                  address={a}
                  countries={COUNTRIES}
                  submitLabel={t("saveChanges")}
                  cancelHref="/account/addresses"
                  cancelLabel={tc("cancel")}
                  useAsBillingLabel={t("useAsBillingAddress")}
                  placeholders={{
                    line1: t("addressLine1Placeholder"),
                    line2: t("addressLine2Placeholder"),
                    city: t("cityPlaceholder"),
                    region: t("stateRegionPlaceholder"),
                    postalCode: t("postalCodePlaceholder"),
                  }}
                />
              </li>
            ) : (
              <li key={a.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <div className="mb-1 flex gap-1.5">
                    {a.is_default && (
                      <span className="inline-block bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                        {t("default")}
                      </span>
                    )}
                    {a.is_billing && (
                      <span className="inline-block bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                        {t("billing")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}
                    <br />
                    {a.city}
                    {a.region ? `, ${a.region}` : ""} {a.postal_code}
                    <br />
                    {COUNTRIES.find((c) => c.code === a.country)?.label ?? a.country}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                  <a
                    href={`/account/addresses?edit=${a.id}`}
                    className="text-foreground underline underline-offset-4 hover:text-accent"
                  >
                    {tc("edit")}
                  </a>
                  {!a.is_default && (
                    <form action={setDefaultAddress.bind(null, a.id)}>
                      <button
                        type="submit"
                        className="text-foreground underline underline-offset-4 hover:text-accent"
                      >
                        {t("setAsDefault")}
                      </button>
                    </form>
                  )}
                  {!a.is_billing && (
                    <form action={setBillingAddress.bind(null, a.id)}>
                      <button
                        type="submit"
                        className="text-foreground underline underline-offset-4 hover:text-accent"
                      >
                        {t("setAsBilling")}
                      </button>
                    </form>
                  )}
                  <form action={deleteAddress.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="text-red-700 underline underline-offset-4 hover:text-red-800"
                    >
                      {tc("remove")}
                    </button>
                  </form>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {!editing && (
        <>
          <h2 className="mt-10 text-sm font-medium text-foreground">
            {t("addNewAddress")}
          </h2>
          <AddressForm
            action={addAddress}
            countries={COUNTRIES}
            submitLabel={t("saveAddress")}
            useAsBillingLabel={t("useAsBillingAddress")}
            placeholders={{
              line1: t("addressLine1Placeholder"),
              line2: t("addressLine2Placeholder"),
              city: t("cityPlaceholder"),
              region: t("stateRegionPlaceholder"),
              postalCode: t("postalCodePlaceholder"),
            }}
          />
        </>
      )}
    </div>
  );
}
