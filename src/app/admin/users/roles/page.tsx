import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES } from "@/lib/permissions";
import { SettingsCard } from "@/components/admin/SettingsCard";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const supabase = createAdminClient();
  const { data: admins } = await supabase.from("admins").select("role");
  const countByRole = new Map<string, number>();
  for (const admin of admins ?? []) {
    countByRole.set(admin.role, (countByRole.get(admin.role) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/admin/users" className="hover:text-neutral-900">
          Users
        </Link>
        <span>›</span>
        <span className="text-neutral-900">Roles</span>
      </div>
      <h1 className="mt-1 text-lg font-semibold text-neutral-900">Roles</h1>
      <p className="mt-2 max-w-lg text-sm text-neutral-500">
        This app uses a fixed set of roles rather than custom ones -- each admin is assigned
        exactly one, from the Users page.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {ADMIN_ROLES.map((role) => (
          <SettingsCard key={role.value} title={role.label} description={role.description}>
            <p className="text-xs text-neutral-500">
              {countByRole.get(role.value) ?? 0} user{(countByRole.get(role.value) ?? 0) === 1 ? "" : "s"}
            </p>
          </SettingsCard>
        ))}
      </div>
    </div>
  );
}
