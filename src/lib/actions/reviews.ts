"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

/**
 * Public submission -- no auth required, matches the guest-checkout /
 * contact-form pattern already used elsewhere in this codebase. Always
 * inserts with status "pending"; the review never becomes visible until
 * an admin approves it via approveReview below. Uses createAdminClient()
 * (service-role) rather than an anon-insert RLS policy, since this is the
 * first public form in the codebase that writes a DB row and keeping the
 * insert path server-only avoids needing to open up anon INSERT on the
 * table at all.
 */
export async function submitReview(
  productId: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = await getTranslations("reviewForm");
  const reviewSchema = z.object({
    reviewer_name: z.string().min(1, t("nameRequired")),
    reviewer_email: z.string().email(t("emailInvalid")),
    rating: z.coerce.number().int().min(1).max(5),
    body: z.string().min(1, t("reviewRequired")),
    // Honeypot -- real visitors never see or fill this field (hidden via
    // CSS in the form), so a non-empty value means a bot filled every field
    // it could find. Silently accept-and-drop rather than telling the bot
    // it was caught.
    website: z.string().optional(),
  });

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (parsed.data.website) {
    // Honeypot tripped -- pretend success so the bot doesn't learn anything.
    return { ok: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    reviewer_name: parsed.data.reviewer_name,
    reviewer_email: parsed.data.reviewer_email,
    rating: parsed.data.rating,
    body: parsed.data.body,
    status: "pending",
  });

  if (error) {
    return {
      ok: false,
      error: t("genericError"),
    };
  }

  return { ok: true };
}

/**
 * Every action below re-checks admin auth itself rather than relying
 * solely on the /admin layout guard -- server actions are callable
 * directly over the network, so the layout's redirect alone isn't enough
 * protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function approveReview(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("product_reviews").update({ status: "approved" }).eq("id", id);
  revalidatePath("/products", "layout");
  revalidatePath("/admin/reviews");
}

export async function rejectReview(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("product_reviews").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/products", "layout");
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("product_reviews").delete().eq("id", id);
  revalidatePath("/products", "layout");
  revalidatePath("/admin/reviews");
}
