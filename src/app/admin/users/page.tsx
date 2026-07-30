import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { addAdmin, removeAdmin, updateAdminRole } from "@/lib/actions/admins";
import { ADMIN_ROLES, type AdminRole } from "@/lib/permissions";
import { AdminRoleSelect } from "@/components/admin/AdminRoleSelect";
import { SettingsCard } from "@/components/admin/SettingsCard";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500";
const primaryButtonClass =
  "rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: admins } = await supabase
    .from("admins")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  const envEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Users</h1>

      {error && (
        <p className="mt-4 max-w-lg rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        <SettingsCard
          title="Admin users"
          description="Anyone listed here can sign in to /admin with a magic link. Their role controls which sections they can see and change -- see the Roles page for what each role covers."
        >
          {!admins || admins.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No admins in the database yet -- falling back to the <code className="text-xs">ADMIN_EMAILS</code>{" "}
              environment variable{envEmails.length > 0 ? ` (${envEmails.join(", ")})` : ""}. Add someone below to
              switch over.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Added</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="py-3 text-neutral-900">{admin.email}</td>
                    <td className="py-3">
                      <form action={updateAdminRole.bind(null, admin.id)}>
                        <AdminRoleSelect roles={ADMIN_ROLES} defaultValue={admin.role as AdminRole} />
                      </form>
                    </td>
                    <td className="py-3 text-neutral-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <form action={removeAdmin.bind(null, admin.id)}>
                        <button type="submit" className="text-xs text-red-600 underline underline-offset-4 hover:text-red-700">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form action={addAdmin} className="mt-4 flex gap-3">
            <input
              name="email"
              type="email"
              required
              placeholder="new-admin@example.com"
              className={`flex-1 ${inputClass}`}
            />
            <select name="role" defaultValue="admin" className={inputClass}>
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button type="submit" className={primaryButtonClass}>
              Add admin
            </button>
          </form>

          <p className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
            See{" "}
            <Link href="/admin/users/roles" className="text-neutral-900 underline underline-offset-4">
              Roles
            </Link>{" "}
            for what each role can access.
          </p>
        </SettingsCard>
      </div>
    </div>
  );
}
