import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/siteSettings";
import {
  updateGeneralSettings,
  updateStoreDefaults,
  updateBusinessDetails,
} from "@/lib/actions/siteSettings";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { SettingsCard } from "@/components/admin/SettingsCard";

export const dynamic = "force-dynamic";

const BUSINESS_TYPES = [
  "Individual",
  "Incorporated Partnership",
  "Unincorporated Partnership",
  "Private Corporation",
  "Incorporated Non-Profit",
  "Unincorporated Non-Profit",
];

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500";
const labelTextClass = "text-sm text-neutral-700";
const helpTextClass = "text-xs text-neutral-500";
const primaryButtonClass =
  "rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

export default async function AdminGeneralSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const [settings, { data: extra }, { data: activity }] = await Promise.all([
    getSiteSettings(),
    supabase
      .from("site_settings")
      .select(
        "order_id_prefix, order_id_suffix, store_currency, store_timezone, store_unit_system, store_weight_unit, business_type, business_legal_name, business_country, business_address_line1, business_address_line2, business_city, business_region, business_postal_code, business_phone"
      )
      .eq("id", true)
      .maybeSingle(),
    supabase
      .from("admin_activity_log")
      .select("id, admin_email, action, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">General</h1>

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
        <SettingsCard
          title="Site information"
          description="Shown in the header, footer, and page copyright across the site."
        >
          <form action={updateGeneralSettings} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Site name</span>
              <input name="site_name" defaultValue={settings.site_name} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Brand logo</span>
              <span className={helpTextClass}>Shown next to the site name in the header.</span>
              <ImageUploadField defaultValue={settings.site_logo_url} fieldName="site_logo_url" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Contact email</span>
              <input
                name="header_email"
                type="email"
                defaultValue={settings.header_email}
                placeholder="hello@example.com"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Phone</span>
              <input
                name="header_phone"
                defaultValue={settings.header_phone}
                placeholder="001 23 456 78 910"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Address</span>
              <input
                name="header_address"
                defaultValue={settings.header_address}
                placeholder="22nd St East Village"
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-900">
              <input type="checkbox" name="reviews_enabled" defaultChecked={settings.reviews_enabled} />
              Show reviews on product pages
            </label>
            <p className={`-mt-2 ${helpTextClass}`}>
              When off, the rating line and Reviews tab are hidden on every product -- customers
              can&apos;t submit new reviews and existing ones stay hidden, but nothing is deleted.
            </p>
            <label className="flex items-center gap-2 text-sm text-neutral-900">
              <input type="checkbox" name="help_page_enabled" defaultChecked={settings.help_page_enabled} />
              Show the Help page
            </label>
            <p className={`-mt-2 ${helpTextClass}`}>
              When off, /help returns a 404. Manage its categories and topics from{" "}
              <a href="/admin/help" className="text-neutral-900 underline underline-offset-4">
                Admin → Help
              </a>
              . Note: a Pages-menu link to /help will still show even when the page itself is
              disabled -- remove the link separately from{" "}
              <a href="/admin/menu" className="text-neutral-900 underline underline-offset-4">
                Admin → Menu
              </a>{" "}
              if needed.
            </p>
            <div>
              <span className={labelTextClass}>Social links</span>
              <p className={`mt-1 ${helpTextClass}`}>Shown in the blog sidebar&apos;s &quot;Follow Us&quot; row.</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Facebook URL</span>
                  <input
                    name="social_facebook_url"
                    type="url"
                    defaultValue={settings.social_facebook_url}
                    placeholder="https://facebook.com/..."
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Twitter/X URL</span>
                  <input
                    name="social_twitter_url"
                    type="url"
                    defaultValue={settings.social_twitter_url}
                    placeholder="https://x.com/..."
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>LinkedIn URL</span>
                  <input
                    name="social_linkedin_url"
                    type="url"
                    defaultValue={settings.social_linkedin_url}
                    placeholder="https://linkedin.com/..."
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Instagram URL</span>
                  <input
                    name="social_instagram_url"
                    type="url"
                    defaultValue={settings.social_instagram_url}
                    placeholder="https://instagram.com/..."
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
            <div>
              <button type="submit" className={primaryButtonClass}>
                Save site information
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Store defaults"
          description="Currency, units, and order numbering used across the admin panel."
        >
          <form action={updateStoreDefaults} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Currency</span>
                <input
                  name="store_currency"
                  defaultValue={extra?.store_currency ?? "EUR"}
                  required
                  maxLength={3}
                  className={`${inputClass} uppercase`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Time zone</span>
                <input
                  name="store_timezone"
                  defaultValue={extra?.store_timezone ?? "Europe/Rome"}
                  required
                  placeholder="Europe/Rome"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Unit system</span>
                <select name="store_unit_system" defaultValue={extra?.store_unit_system ?? "metric"} className={inputClass}>
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Default weight unit</span>
                <select name="store_weight_unit" defaultValue={extra?.store_weight_unit ?? "kg"} className={inputClass}>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="oz">Ounce (oz)</option>
                </select>
              </label>
            </div>
            <div>
              <span className={labelTextClass}>Order ID format</span>
              <p className={`mt-1 ${helpTextClass}`}>Shown on the order page and customer order notifications.</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Prefix</span>
                  <input name="order_id_prefix" defaultValue={extra?.order_id_prefix ?? "#"} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={helpTextClass}>Suffix</span>
                  <input name="order_id_suffix" defaultValue={extra?.order_id_suffix ?? ""} className={inputClass} />
                </label>
              </div>
            </div>
            <div>
              <button type="submit" className={primaryButtonClass}>
                Save store defaults
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Business details"
          description="Legal business entity used for financial products, taxes, and invoicing. Not shown to customers."
        >
          <form action={updateBusinessDetails} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Business type</span>
              <select name="business_type" defaultValue={extra?.business_type ?? ""} className={inputClass}>
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Registered legal business name</span>
              <input name="business_legal_name" defaultValue={extra?.business_legal_name ?? ""} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className={labelTextClass}>Address line 1</span>
                <input name="business_address_line1" defaultValue={extra?.business_address_line1 ?? ""} className={inputClass} />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className={labelTextClass}>Address line 2</span>
                <input name="business_address_line2" defaultValue={extra?.business_address_line2 ?? ""} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>City</span>
                <input name="business_city" defaultValue={extra?.business_city ?? ""} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Province/Region</span>
                <input name="business_region" defaultValue={extra?.business_region ?? ""} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Postal code</span>
                <input name="business_postal_code" defaultValue={extra?.business_postal_code ?? ""} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Country (2-letter code)</span>
                <input
                  name="business_country"
                  defaultValue={extra?.business_country ?? ""}
                  placeholder="IT"
                  maxLength={2}
                  className={`${inputClass} uppercase`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Phone number</span>
                <input name="business_phone" defaultValue={extra?.business_phone ?? ""} className={inputClass} />
              </label>
            </div>
            <div>
              <button type="submit" className={primaryButtonClass}>
                Save business details
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard title="Store activity log" description="A record of admin sign-ins to this store.">
          {!activity || activity.length === 0 ? (
            <p className="text-sm text-neutral-500">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {activity.map((entry) => (
                <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-neutral-900">
                    {entry.admin_email}{" "}
                    <span className="text-neutral-500">
                      {entry.action === "accessed_shop" ? "accessed shop" : entry.action}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">{new Date(entry.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </SettingsCard>
      </div>
    </div>
  );
}
