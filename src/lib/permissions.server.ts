import { redirect } from "next/navigation";
import { getAdminUser, getAdminRole } from "@/lib/auth";
import { roleHasSection, type AdminSection } from "@/lib/permissions";

/**
 * Server-action guard: confirms the signed-in user is an admin AND their
 * role covers `section`, redirecting to /admin otherwise. Replaces the
 * bare requireAdmin() that used to live in every actions/*.ts file --
 * each file now passes its own section instead. Kept as a per-call check
 * (not just a layout-level one) since Server Actions are network-callable
 * directly, same reasoning as the original requireAdmin().
 *
 * Split into its own file (separate from src/lib/permissions.ts) because
 * this pulls in getAdminUser/getAdminRole, which depend on next/headers --
 * fine for server actions, but it would drag next/headers into the client
 * bundle if AdminSidebar ("use client") imported it just for the
 * roleHasSection/AdminRole/ADMIN_ROLES helpers it actually needs.
 */
export async function requireSection(section: AdminSection) {
  const user = await getAdminUser();
  if (!user) redirect("/admin");

  const role = await getAdminRole(user.email);
  if (!roleHasSection(role, section)) redirect("/admin");

  return user;
}
