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
  // Checkboxes are only present in FormData when checked ("on"), so a
  // missing key means unchecked/false rather than a validation failure.
  reviews_enabled: z.preprocess((v) => v === "on", z.boolean()),
  help_page_enabled: z.preprocess((v) => v === "on", z.boolean()),
  social_facebook_url: z.string().optional().default(""),
  social_twitter_url: z.string().optional().default(""),
  social_linkedin_url: z.string().optional().default(""),
  social_instagram_url: z.string().optional().default(""),
  // Entered in the form as euros, stored in cents like every other price
  // field in this codebase (products.price_cents, etc.).
  shipping_flat_rate_cents: z.coerce
    .number()
    .nonnegative("Shipping rate can't be negative")
    .transform((v) => Math.round(v * 100)),
  free_shipping_threshold_cents: z.coerce
    .number()
    .nonnegative("Free shipping threshold can't be negative")
    .transform((v) => Math.round(v * 100)),
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
