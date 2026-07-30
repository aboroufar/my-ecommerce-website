"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/permissions.server";
import { siteContentKeys, type SiteContentKey } from "@/lib/content";


const contentSchema = z.record(z.string(), z.string());

export async function updateSiteContent(formData: FormData) {
  await requireSection("content");

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
