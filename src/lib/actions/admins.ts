"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES, type AdminRole } from "@/lib/permissions";
import { requireSection } from "@/lib/permissions.server";

const ROLE_VALUES = ADMIN_ROLES.map((r) => r.value) as [AdminRole, ...AdminRole[]];

const addAdminSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(ROLE_VALUES),
});

const roleSchema = z.object({
  role: z.enum(ROLE_VALUES),
});

export async function addAdmin(formData: FormData) {
  await requireSection("users");

  const parsed = addAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/users?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admins")
    .insert({ email: parsed.data.email.toLowerCase(), role: parsed.data.role });

  if (error) {
    // unique_violation -- already an admin, not a real error to surface loudly
    const message =
      error.code === "23505" ? "That email is already an admin." : error.message;
    redirect(`/admin/users?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateAdminRole(id: string, formData: FormData) {
  await requireSection("users");

  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/users?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();

  // Guard against demoting the last remaining Administrator -- that would
  // leave nobody able to manage admin users/roles at all (unlike removeAdmin's
  // "last admin" guard, this specifically checks the admin *role*, not just
  // row count, since a store could have many non-admin-role rows).
  if (parsed.data.role !== "admin") {
    const { count } = await supabase
      .from("admins")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    const { data: current } = await supabase.from("admins").select("role").eq("id", id).maybeSingle();

    if (current?.role === "admin" && (count ?? 0) <= 1) {
      redirect(
        `/admin/users?error=${encodeURIComponent(
          "Can't change the last Administrator's role. Promote another admin first."
        )}`
      );
    }
  }

  const { error } = await supabase.from("admins").update({ role: parsed.data.role }).eq("id", id);

  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function removeAdmin(id: string) {
  await requireSection("users");

  const supabase = createAdminClient();

  // Guard against removing the last admin -- that would lock everyone out
  // of /admin until someone edits ADMIN_EMAILS and redeploys (the fallback
  // in src/lib/auth.ts only kicks in when the table is fully empty).
  const { count } = await supabase
    .from("admins")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) <= 1) {
    redirect(
      `/admin/users?error=${encodeURIComponent(
        "Can't remove the last admin. Add another admin first."
      )}`
    );
  }

  const { error } = await supabase.from("admins").delete().eq("id", id);

  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
