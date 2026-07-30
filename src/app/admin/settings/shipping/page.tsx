import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateShippingSettings, updateDeliveryEstimateSettings } from "@/lib/actions/siteSettings";
import { SettingsCard } from "@/components/admin/SettingsCard";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500";
const labelTextClass = "text-sm text-neutral-700";
const helpTextClass = "text-xs text-neutral-500";
const primaryButtonClass =
  "rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

export default async function AdminShippingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: settings }, { count: packageCount }] = await Promise.all([
    supabase
      .from("site_settings")
      .select(
        "shipping_flat_rate_cents, free_shipping_threshold_cents, ship_from_name, ship_from_line1, ship_from_line2, ship_from_city, ship_from_region, ship_from_postal_code, ship_from_country, ship_from_phone, ship_from_email, delivery_estimate_enabled, fulfillment_time_days, transit_time_min_days, transit_time_max_days"
      )
      .eq("id", true)
      .maybeSingle(),
    supabase.from("package_profiles").select("id", { count: "exact", head: true }),
  ]);

  const shippoConfigured = Boolean(process.env.SHIPPO_API_KEY);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Shipping and delivery</h1>

      {error && (
        <p className="mt-4 max-w-lg rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-4 max-w-lg rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        <SettingsCard title="Carrier">
          <p className="text-sm text-neutral-900">
            Status:{" "}
            <span className={shippoConfigured ? "text-green-700" : "text-red-600"}>
              {shippoConfigured ? "Shippo connected" : "Shippo not configured"}
            </span>
          </p>
          <p className={`mt-1 ${helpTextClass}`}>
            Labels and live rates (including Poste Italiane, BRT, GLS, and others) are fetched
            through{" "}
            <a
              href="https://apps.shippo.com/carriers"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-900 underline underline-offset-4"
            >
              Shippo
            </a>
            . Enable and connect a carrier account on the Shippo dashboard, set{" "}
            <code className="text-xs">SHIPPO_API_KEY</code> in your environment variables, then
            buy labels from an order&apos;s detail page -- there&apos;s no separate carrier list
            to manage here. The address below is used as the sender on every rate/label request.
          </p>
        </SettingsCard>

        <SettingsCard title="Shipping rates" description="Applied automatically at checkout based on order subtotal.">
          <form action={updateShippingSettings} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Standard shipping rate (€)</span>
                <input
                  name="shipping_flat_rate_cents"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={((settings?.shipping_flat_rate_cents ?? 0) / 100).toFixed(2)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Free shipping over (€)</span>
                <input
                  name="free_shipping_threshold_cents"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={((settings?.free_shipping_threshold_cents ?? 0) / 100).toFixed(2)}
                  className={inputClass}
                />
              </label>
            </div>

            <div>
              <span className={labelTextClass}>Shipping origin</span>
              <p className={`mt-1 ${helpTextClass}`}>
                Where labels ship from -- required to fetch carrier rates when buying a shipping
                label on an order&apos;s admin page.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <label className="col-span-2 flex flex-col gap-1.5">
                  <span className={helpTextClass}>Sender name</span>
                  <input name="ship_from_name" defaultValue={settings?.ship_from_name ?? ""} className={inputClass} />
                </label>
                <label className="col-span-2 flex flex-col gap-1.5">
                  <span className={helpTextClass}>Address line 1</span>
                  <input name="ship_from_line1" defaultValue={settings?.ship_from_line1 ?? ""} className={inputClass} />
                </label>
                <label className="col-span-2 flex flex-col gap-1.5">
                  <span className={helpTextClass}>Address line 2</span>
                  <input name="ship_from_line2" defaultValue={settings?.ship_from_line2 ?? ""} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>City</span>
                  <input name="ship_from_city" defaultValue={settings?.ship_from_city ?? ""} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Region/State</span>
                  <input name="ship_from_region" defaultValue={settings?.ship_from_region ?? ""} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Postal code</span>
                  <input
                    name="ship_from_postal_code"
                    defaultValue={settings?.ship_from_postal_code ?? ""}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Country (2-letter code)</span>
                  <input
                    name="ship_from_country"
                    defaultValue={settings?.ship_from_country ?? ""}
                    placeholder="IT"
                    maxLength={2}
                    className={`${inputClass} uppercase`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Sender phone</span>
                  <input name="ship_from_phone" defaultValue={settings?.ship_from_phone ?? ""} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Sender email</span>
                  <input
                    name="ship_from_email"
                    type="email"
                    defaultValue={settings?.ship_from_email ?? ""}
                    className={inputClass}
                  />
                </label>
              </div>
              <p className={`mt-2 ${helpTextClass}`}>
                Some carriers (e.g. USPS) require a sender phone or email to purchase a label.
              </p>
            </div>

            <div>
              <button type="submit" className={primaryButtonClass}>
                Save shipping settings
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Estimated delivery dates"
          description="Shown on product pages and in cart -- computed from fulfillment time plus carrier transit time, not a live carrier lookup."
        >
          <form action={updateDeliveryEstimateSettings} className="flex flex-col gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="delivery_estimate_enabled"
                defaultChecked={settings?.delivery_estimate_enabled ?? false}
                className="h-4 w-4 accent-neutral-900"
              />
              <span className="text-sm text-neutral-900">Show estimated delivery dates</span>
            </label>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Fulfillment time (business days)</span>
                <input
                  name="fulfillment_time_days"
                  type="number"
                  min={0}
                  defaultValue={settings?.fulfillment_time_days ?? 1}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Transit time, min (business days)</span>
                <input
                  name="transit_time_min_days"
                  type="number"
                  min={0}
                  defaultValue={settings?.transit_time_min_days ?? 3}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Transit time, max (business days)</span>
                <input
                  name="transit_time_max_days"
                  type="number"
                  min={0}
                  defaultValue={settings?.transit_time_max_days ?? 5}
                  className={inputClass}
                />
              </label>
            </div>

            <p className={helpTextClass}>
              Delivery date = today + fulfillment time + transit time, skipping weekends. E.g. with
              defaults, an order placed today ships the next business day and arrives 3–5 business
              days after that.
            </p>

            <div>
              <button type="submit" className={primaryButtonClass}>
                Save
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Packages"
          description="Reusable box/weight profiles assigned to products for accurate shipping rates and labels."
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-900">
              {packageCount ?? 0} package {packageCount === 1 ? "profile" : "profiles"}
            </p>
            <Link
              href="/admin/packages"
              className="text-sm text-neutral-900 underline underline-offset-4"
            >
              Manage packages →
            </Link>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
