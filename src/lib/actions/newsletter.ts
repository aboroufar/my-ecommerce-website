"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Subscribes an email to the newsletter list. Uses the service-role client
 * since newsletter_subscribers has no anon/authenticated write policy --
 * same trust boundary as every other write in this app (products,
 * categories, admins all go through a server action, not a direct RLS
 * grant), to avoid an unauthenticated table anyone can script-flood.
 */
export async function subscribeToNewsletter(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = await getTranslations("newsletter");
  const emailSchema = z.string().email(t("emailInvalid"));

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: parsed.data.toLowerCase() });

  if (error) {
    // unique_violation -- already subscribed, treat as success rather
    // than surfacing a confusing error for a perfectly fine outcome
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: t("genericError") };
  }

  return { ok: true };
}
