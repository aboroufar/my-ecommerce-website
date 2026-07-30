"use client";

import type { AdminRole } from "@/lib/permissions";

// Auto-submits the moment a new role is picked -- avoids a separate "Save"
// button per row in what's otherwise a compact table.
export function AdminRoleSelect({
  roles,
  defaultValue,
}: {
  roles: { value: AdminRole; label: string }[];
  defaultValue: AdminRole;
}) {
  return (
    <select
      name="role"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-neutral-500"
    >
      {roles.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
