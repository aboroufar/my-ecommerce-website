"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { siteContentKeys, type SiteContentKey } from "@/lib/content";

/**
 * Every action here re-checks admin auth itself rather than relying solely
 * on the layout guard -- server actions are callable directly over the
 * network, so the layout's redirect alone isn't enough protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

const contentSchema = z.record(z.string(), z.string());

export async function updateSiteContent(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/admin/content?error=Invalid+form+submission");
  }

  const rows = siteContentKeys
    .filter((key): key is SiteContentKey => key in parsed.data)
    .map((key) => ({
      key,
      value: parsed.data[key],
      updated_at: new Date().toISOString(),
    }));

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_content").upsert(rows);

  if (error) {
    redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/content");
  redirect("/admin/content?saved=1");
}
