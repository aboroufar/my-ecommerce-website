import { createAdminClient } from "@/lib/supabase/admin";
import { updateCustomerAccountsSettings } from "@/lib/actions/siteSettings";
import { SettingsCard } from "@/components/admin/SettingsCard";

export const dynamic = "force-dynamic";

const helpTextClass = "text-xs text-neutral-500";
const primaryButtonClass =
  "rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

export default async function AdminCustomerAccountsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("google_signin_enabled")
    .eq("id", true)
    .maybeSingle();

  const googleSigninEnabled = settings?.google_signin_enabled ?? true;

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Customer accounts</h1>

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
        <SettingsCard title="Authentication" description="Manage sign-in options for customer accounts.">
          <form action={updateCustomerAccountsSettings} className="flex flex-col gap-4">
            <label className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-3 py-2.5">
              <span className="flex flex-col">
                <span className="text-sm text-neutral-900">Sign in with Google</span>
                <span className={helpTextClass}>
                  Show a &quot;Continue with Google&quot; button on the customer sign-in page.
                </span>
              </span>
              <input
                type="checkbox"
                name="google_signin_enabled"
                defaultChecked={googleSigninEnabled}
                className="h-4 w-4 shrink-0 accent-neutral-900"
              />
            </label>

            <p className={helpTextClass}>
              Google sign-in itself (the OAuth client ID/secret) is configured in your{" "}
              <a
                href="https://supabase.com/dashboard/project/_/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-900 underline underline-offset-4"
              >
                Supabase Dashboard → Authentication → Providers
              </a>
              . This toggle only controls whether the button is shown — turning it off doesn&apos;t
              disconnect Google from Supabase, it just hides the option here.
            </p>

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
