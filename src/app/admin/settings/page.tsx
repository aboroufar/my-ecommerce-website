import { createAdminClient } from "@/lib/supabase/admin";
import { addAdmin, removeAdmin } from "@/lib/actions/admins";
import { getSiteSettings } from "@/lib/siteSettings";
import { updateSiteSettings } from "@/lib/actions/siteSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: admins }, settings] = await Promise.all([
    supabase.from("admins").select("id, email, created_at").order("created_at", { ascending: true }),
    getSiteSettings(),
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
          manage products, orders, and customers.
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
