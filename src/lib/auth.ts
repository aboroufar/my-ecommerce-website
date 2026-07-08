import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ADMIN_EMAILS is a fallback only, checked when the `admins` table can't be
 * read or is empty -- this keeps a store owner from ever being locked out
 * of /admin (e.g. immediately after the admins-table migration runs, before
 * anyone has been added to it, or if the DB is briefly unreachable).
 * The `admins` table is the primary source of truth; manage it from
 * /admin/settings.
 */
function isEnvAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/**
 * Checks the `admins` table first; falls back to ADMIN_EMAILS if the table
 * is empty or the query fails for any reason. Uses the service-role client
 * since `admins` has no RLS grants for anon/authenticated (same pattern as
 * products/categories writes) -- a regular session-scoped client could never
 * read it at all.
 */
export async function isAdminEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();

  try {
    const supabase = createAdminClient();
    const { data: allAdmins, error } = await supabase
      .from("admins")
      .select("email");

    if (error) throw error;

    // Empty table -- fall back rather than lock everyone out.
    if (allAdmins.length === 0) return isEnvAdminEmail(email);

    return allAdmins.some((a) => a.email.toLowerCase() === normalized);
  } catch (err) {
    console.error("isAdminEmail: admins table check failed, falling back to ADMIN_EMAILS:", err);
    return isEnvAdminEmail(email);
  }
}

/** Returns the logged-in Supabase user, or null if there's no session. */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Returns the logged-in user only if their email is on the admin allow-list. */
export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user || !(await isAdminEmail(user.email))) return null;
  return user;
}
