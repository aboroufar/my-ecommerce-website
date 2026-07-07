import { createClient } from "@/lib/supabase/server";

/**
 * Simple allow-list admin check: no roles table, no permissions system --
 * just a comma-separated list of trusted emails in an env var. Appropriate
 * for a small store run by one or a few people; revisit if you need
 * per-user permissions later.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
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
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
