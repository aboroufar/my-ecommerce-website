"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

/**
 * Every action here re-checks admin auth itself rather than relying solely
 * on the layout guard -- server actions are callable directly over the
 * network, so the layout's redirect alone isn't enough protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function addAdmin(formData: FormData) {
  await requireAdmin();

  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .insert({ email: parsed.data.email.toLowerCase() });

  if (error) {
    // unique_violation -- already an admin, not a real error to surface loudly
    const message =
      error.code === "23505" ? "That email is already an admin." : error.message;
    redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function removeAdmin(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();

  // Guard against removing the last admin -- that would lock everyone out
  // of /admin until someone edits ADMIN_EMAILS and redeploys (the fallback
  // in src/lib/auth.ts only kicks in when the table is fully empty).
  const { count } = await supabase
    .from("admins")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) <= 1) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "Can't remove the last admin. Add another admin first."
      )}`
    );
  }

  const { error } = await supabase.from("admins").delete().eq("id", id);

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
