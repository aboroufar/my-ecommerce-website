"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const settingsSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  header_email: z.string().default(""),
  header_phone: z.string().default(""),
  header_address: z.string().default(""),
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
