import { createAdminClient } from "@/lib/supabase/admin";
import { addAdmin, removeAdmin } from "@/lib/actions/admins";
import { getSiteSettings } from "@/lib/siteSettings";
import { updateSiteSettings } from "@/lib/actions/siteSettings";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: admins }, settings, { data: shipFrom }] = await Promise.all([
    supabase.from("admins").select("id, email, created_at").order("created_at", { ascending: true }),
    getSiteSettings(),
    supabase
      .from("site_settings")
      .select(
        "ship_from_name, ship_from_line1, ship_from_line2, ship_from_city, ship_from_region, ship_from_postal_code, ship_from_country, ship_from_phone, ship_from_email"
      )
      .eq("id", true)
      .maybeSingle(),
  ]);

  const envEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Settings</h1>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-6 max-w-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}

      <div className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Site information
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Shown in the header, footer, and page copyright across the site.
        </p>

        <form action={updateSiteSettings} className="mt-6 max-w-lg space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Site name</span>
            <input
              name="site_name"
              defaultValue={settings.site_name}
              required
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Brand logo</span>
            <span className="text-xs text-muted/70">
              Shown next to the site name in the header.
            </span>
            <ImageUploadField
              defaultValue={settings.site_logo_url}
              fieldName="site_logo_url"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Contact email</span>
            <input
              name="header_email"
              type="email"
              defaultValue={settings.header_email}
              placeholder="hello@example.com"
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Phone</span>
            <input
              name="header_phone"
              defaultValue={settings.header_phone}
              placeholder="001 23 456 78 910"
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Address</span>
            <input
              name="header_address"
              defaultValue={settings.header_address}
              placeholder="22nd St East Village"
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="reviews_enabled"
              defaultChecked={settings.reviews_enabled}
            />
            Show reviews on product pages
          </label>
          <p className="text-xs text-muted">
            When off, the rating line and Reviews tab are hidden on every
            product -- customers can&apos;t submit new reviews and existing
            ones stay hidden, but nothing is deleted.
          </p>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="help_page_enabled"
              defaultChecked={settings.help_page_enabled}
            />
            Show the Help page
          </label>
          <p className="text-xs text-muted">
            When off, /help returns a 404. Manage its categories and topics
            from{" "}
            <a href="/admin/help" className="text-accent underline underline-offset-4 hover:opacity-80">
              Admin → Help
            </a>
            . Note: a Pages-menu link to /help will still show even when the
            page itself is disabled -- remove the link separately from{" "}
            <a href="/admin/menu" className="text-accent underline underline-offset-4 hover:opacity-80">
              Admin → Menu
            </a>{" "}
            if needed.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Standard shipping rate (€)</span>
              <input
                name="shipping_flat_rate_cents"
                type="number"
                min={0}
                step="0.01"
                defaultValue={(settings.shipping_flat_rate_cents / 100).toFixed(2)}
                className="border border-line bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Free shipping over (€)</span>
              <input
                name="free_shipping_threshold_cents"
                type="number"
                min={0}
                step="0.01"
                defaultValue={(settings.free_shipping_threshold_cents / 100).toFixed(2)}
                className="border border-line bg-transparent px-3 py-2 text-sm"
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            Applied automatically at checkout based on order subtotal.
          </p>
          <div>
            <span className="text-xs text-muted">Shipping origin</span>
            <p className="mt-1 text-xs text-muted/70">
              Where labels ship from -- required to fetch carrier rates when
              buying a shipping label on an order&apos;s admin page.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs text-muted">Sender name</span>
                <input
                  name="ship_from_name"
                  defaultValue={shipFrom?.ship_from_name ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs text-muted">Address line 1</span>
                <input
                  name="ship_from_line1"
                  defaultValue={shipFrom?.ship_from_line1 ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="text-xs text-muted">Address line 2</span>
                <input
                  name="ship_from_line2"
                  defaultValue={shipFrom?.ship_from_line2 ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">City</span>
                <input
                  name="ship_from_city"
                  defaultValue={shipFrom?.ship_from_city ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Region/State</span>
                <input
                  name="ship_from_region"
                  defaultValue={shipFrom?.ship_from_region ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Postal code</span>
                <input
                  name="ship_from_postal_code"
                  defaultValue={shipFrom?.ship_from_postal_code ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Country (2-letter code)</span>
                <input
                  name="ship_from_country"
                  defaultValue={shipFrom?.ship_from_country ?? ""}
                  placeholder="IT"
                  maxLength={2}
                  className="border border-line bg-transparent px-3 py-2 text-sm uppercase"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Sender phone</span>
                <input
                  name="ship_from_phone"
                  defaultValue={shipFrom?.ship_from_phone ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Sender email</span>
                <input
                  name="ship_from_email"
                  type="email"
                  defaultValue={shipFrom?.ship_from_email ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted/70">
              Some carriers (e.g. USPS) require a sender phone or email to
              purchase a label.
            </p>
          </div>
          <div>
            <span className="text-xs text-muted">Social links</span>
            <p className="mt-1 text-xs text-muted/70">
              Shown in the blog sidebar&apos;s &quot;Follow Us&quot; row.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Facebook URL</span>
                <input
                  name="social_facebook_url"
                  type="url"
                  defaultValue={settings.social_facebook_url}
                  placeholder="https://facebook.com/..."
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Twitter/X URL</span>
                <input
                  name="social_twitter_url"
                  type="url"
                  defaultValue={settings.social_twitter_url}
                  placeholder="https://x.com/..."
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">LinkedIn URL</span>
                <input
                  name="social_linkedin_url"
                  type="url"
                  defaultValue={settings.social_linkedin_url}
                  placeholder="https://linkedin.com/..."
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Instagram URL</span>
                <input
                  name="social_instagram_url"
                  type="url"
                  defaultValue={settings.social_instagram_url}
                  placeholder="https://instagram.com/..."
                  className="border border-line bg-transparent px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Save site information
          </button>
        </form>
      </div>

      <div className="mt-14 border-t border-line pt-10">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Admin users
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Anyone listed here can sign in to /admin with a magic link and
          manage products, orders, and clients.
        </p>

        {!admins || admins.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No admins in the database yet -- falling back to the{" "}
            <code className="text-xs">ADMIN_EMAILS</code> environment
            variable{envEmails.length > 0 ? ` (${envEmails.join(", ")})` : ""}
            . Add someone below to switch over.
          </p>
        ) : (
          <table className="mt-6 w-full max-w-lg text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Added</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="py-3 text-foreground">{admin.email}</td>
                  <td className="py-3 text-muted">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <form action={removeAdmin.bind(null, admin.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form action={addAdmin} className="mt-6 flex max-w-lg gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="new-admin@example.com"
            className="flex-1 border border-line bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add admin
          </button>
        </form>
      </div>
    </div>
  );
}
