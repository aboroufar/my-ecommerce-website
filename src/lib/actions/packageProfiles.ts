"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const packageProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  package_type: z.enum(["box", "envelope", "soft_package"]),
  length_cm: z.union([z.coerce.number().positive(), z.literal("")]).optional().default(""),
  width_cm: z.union([z.coerce.number().positive(), z.literal("")]).optional().default(""),
  height_cm: z.union([z.coerce.number().positive(), z.literal("")]).optional().default(""),
  empty_weight_grams: z
    .union([z.coerce.number().positive(), z.literal("")])
    .optional()
    .default(""),
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

export async function createPackageProfile(formData: FormData) {
  await requireAdmin();

  const parsed = packageProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/packages?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("package_profiles").insert({
    name: parsed.data.name,
    package_type: parsed.data.package_type,
    length_cm: parsed.data.length_cm === "" ? null : parsed.data.length_cm,
    width_cm: parsed.data.width_cm === "" ? null : parsed.data.width_cm,
    height_cm: parsed.data.height_cm === "" ? null : parsed.data.height_cm,
    empty_weight_grams:
      parsed.data.empty_weight_grams === "" ? null : parsed.data.empty_weight_grams,
  });

  if (error) redirect(`/admin/packages?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/packages");
  revalidatePath("/admin/products");
  redirect("/admin/packages");
}

export async function updatePackageProfile(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = packageProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/packages?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("package_profiles")
    .update({
      name: parsed.data.name,
      package_type: parsed.data.package_type,
      length_cm: parsed.data.length_cm === "" ? null : parsed.data.length_cm,
      width_cm: parsed.data.width_cm === "" ? null : parsed.data.width_cm,
      height_cm: parsed.data.height_cm === "" ? null : parsed.data.height_cm,
      empty_weight_grams:
        parsed.data.empty_weight_grams === "" ? null : parsed.data.empty_weight_grams,
    })
    .eq("id", id);

  if (error) redirect(`/admin/packages?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/packages");
  revalidatePath("/admin/products");
  redirect("/admin/packages");
}

export async function deletePackageProfile(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  // products.package_profile_id references this with ON DELETE SET NULL,
  // so deleting a profile just clears it from any product using it rather
  // than failing or deleting those products.
  const { error } = await supabase.from("package_profiles").delete().eq("id", id);

  if (error) redirect(`/admin/packages?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/packages");
  revalidatePath("/admin/products");
  redirect("/admin/packages");
}
