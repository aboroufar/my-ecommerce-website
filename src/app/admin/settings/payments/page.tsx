import { createAdminClient } from "@/lib/supabase/admin";
import { updatePaymentSettings, updatePaymentMethodsSettings } from "@/lib/actions/siteSettings";
import { SettingsCard } from "@/components/admin/SettingsCard";
import { TOGGLEABLE_PAYMENT_METHODS } from "@/lib/payments";

export const dynamic = "force-dynamic";

const helpTextClass = "text-xs text-neutral-500";
const primaryButtonClass =
  "rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

const CAPTURE_METHODS: { value: string; label: string; description: string }[] = [
  {
    value: "automatic",
    label: "Automatically at checkout",
    description: "Capture payment when an order is placed.",
  },
  {
    value: "on_fulfillment",
    label: "Automatically when the entire order is fulfilled",
    description: "Authorize payment at checkout and capture once the entire order is fulfilled.",
  },
  {
    value: "manual",
    label: "Manually",
    description: "Authorize payment at checkout and capture manually.",
  },
];

export default async function AdminPaymentsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("payment_capture_method, payment_methods_enabled")
    .eq("id", true)
    .maybeSingle();

  const captureMethod = settings?.payment_capture_method ?? "automatic";
  const enabledMethods = new Set(settings?.payment_methods_enabled ?? []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Payments</h1>

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
          title="Payment methods"
          description="Card is always accepted. Enable additional methods to offer at checkout — all processed through Stripe, settling into the same balance as card payments."
        >
          <form action={updatePaymentMethodsSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 opacity-60">
                <input type="checkbox" checked disabled className="h-4 w-4 shrink-0 accent-neutral-900" />
                <span className="text-sm text-neutral-900">Card</span>
              </label>
              {TOGGLEABLE_PAYMENT_METHODS.map((method) => (
                <label key={method.value} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="payment_methods_enabled"
                    value={method.value}
                    defaultChecked={enabledMethods.has(method.value)}
                    className="h-4 w-4 shrink-0 accent-neutral-900"
                  />
                  <span className="text-sm text-neutral-900">{method.label}</span>
                </label>
              ))}
            </div>

            <div>
              <button type="submit" className={primaryButtonClass}>
                Save
              </button>
            </div>
          </form>

          <p className={`mt-4 border-t border-neutral-100 pt-4 ${helpTextClass}`}>
            These checkboxes control which methods are <em>offered</em> at checkout — they don&apos;t
            connect a provider account. Klarna and Satispay work as soon as they&apos;re checked here.
            PayPal is also processed through Stripe, but Stripe requires it to be turned on once in
            your Stripe account before it will actually appear at checkout, even if checked here. Do
            that from{" "}
            <a
              href="https://dashboard.stripe.com/settings/payment_methods"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-900 underline underline-offset-4"
            >
              Stripe Dashboard → Settings → Payment methods
            </a>
            .
          </p>
        </SettingsCard>

        <SettingsCard
          title="Payment capture method"
          description="Payments are authorized when an order is placed. Select how to capture payments."
        >
          <form action={updatePaymentSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {CAPTURE_METHODS.map((method) => (
                <label key={method.value} className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_capture_method"
                    value={method.value}
                    defaultChecked={captureMethod === method.value}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-neutral-900"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm text-neutral-900">{method.label}</span>
                    <span className={helpTextClass}>{method.description}</span>
                  </span>
                </label>
              ))}
            </div>

            <div>
              <button type="submit" className={primaryButtonClass}>
                Save
              </button>
            </div>
          </form>
        </SettingsCard>
      </div>
    </div>
  );
}
