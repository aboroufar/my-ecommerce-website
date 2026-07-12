"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const settingsSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_logo_url: z.string().default(""),
  header_email: z.string().default(""),
  header_phone: z.string().default(""),
  header_address: z.string().default(""),
});

const categoriesMenuLabelSchema = z.object({
  categories_menu_label: z.string().min(1, "Label is required"),
});

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  // Site name/contact info appears in the root layout (header/footer),
  // so every page needs revalidating, not just the homepage.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function updateCategoriesMenuLabel(formData: FormData) {
  await requireAdmin();

  const parsed = categoriesMenuLabelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/menu?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/menu?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}
