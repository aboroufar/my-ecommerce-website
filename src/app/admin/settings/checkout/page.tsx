import { createAdminClient } from "@/lib/supabase/admin";
import { updateCheckoutSettings } from "@/lib/actions/checkoutSettings";
import { parseCheckoutSettings } from "@/lib/checkoutSettings";
import { SettingsCard } from "@/components/admin/SettingsCard";
import { CustomFieldsEditor } from "@/components/admin/CustomFieldsEditor";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500";
const helpTextClass = "text-xs text-neutral-500";
const primaryButtonClass =
  "rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

export default async function AdminCheckoutSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("site_settings")
    .select("checkout_settings")
    .eq("id", true)
    .maybeSingle();

  const settings = parseCheckoutSettings(row?.checkout_settings);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Checkout</h1>
      <p className="mt-1 max-w-lg text-sm text-neutral-500">
        Checkout runs on Stripe&apos;s hosted page, so this controls which of Stripe&apos;s built-in
        fields to collect from shoppers — not the page&apos;s layout or branding. For colors/logo,
        use{" "}
        <a
          href="https://dashboard.stripe.com/settings/branding"
          target="_blank"
          rel="noreferrer"
          className="text-neutral-900 underline underline-offset-4"
        >
          Stripe Dashboard → Settings → Branding
        </a>
        .
      </p>

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

      <form action={updateCheckoutSettings} className="mt-5 flex flex-col gap-4">
        <SettingsCard
          title="Contact information"
          description="Email is always collected. Phone number is optional by default."
        >
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="requirePhoneNumber"
              defaultChecked={settings.requirePhoneNumber}
              className="h-4 w-4 accent-neutral-900"
            />
            <span className="text-sm text-neutral-900">Require phone number</span>
          </label>
        </SettingsCard>

        <SettingsCard
          title="Billing address"
          description="Shipping address is always collected. Choose whether billing address is also collected."
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="billingAddressCollection"
                value="auto"
                defaultChecked={settings.billingAddressCollection === "auto"}
                className="mt-0.5 h-4 w-4 accent-neutral-900"
              />
              <span className="flex flex-col">
                <span className="text-sm text-neutral-900">Only when required</span>
                <span className={helpTextClass}>
                  Stripe collects it only if needed for the chosen payment method.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="billingAddressCollection"
                value="required"
                defaultChecked={settings.billingAddressCollection === "required"}
                className="mt-0.5 h-4 w-4 accent-neutral-900"
              />
              <span className="flex flex-col">
                <span className="text-sm text-neutral-900">Always collect</span>
                <span className={helpTextClass}>
                  Shoppers enter a billing address separately, even if it matches shipping.
                </span>
              </span>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Custom fields"
          description="Collect up to 3 extra pieces of information at checkout (e.g. gift message, delivery notes). Answers appear on the order in Stripe."
        >
          <CustomFieldsEditor initialFields={settings.customFields} />
        </SettingsCard>

        <SettingsCard
          title="Policies"
          description="Require shoppers to confirm they agree to your terms before paying."
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="requireTermsAcceptance"
                defaultChecked={settings.requireTermsAcceptance}
                className="h-4 w-4 accent-neutral-900"
              />
              <span className="text-sm text-neutral-900">
                Require checkbox: &quot;I agree to the Terms of Service&quot;
              </span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={helpTextClass}>Terms of Service URL (for your own reference)</span>
              <input
                name="termsUrl"
                type="url"
                defaultValue={settings.termsUrl}
                placeholder="https://yourdomain.com/terms"
                className={`max-w-sm ${inputClass}`}
              />
            </label>
          </div>
        </SettingsCard>

        <div>
          <button type="submit" className={primaryButtonClass}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
