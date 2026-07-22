"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

/**
 * Organizational labels for discount records, kept in their own
 * discount_labels/discount_label_links tables so they don't share a pool
 * with product tags or blog tags -- mirrors src/lib/actions/tags.ts, but
 * against discount_labels instead of the product-facing tags table.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const labelSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createDiscountLabelInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  await requireAdmin();

  const parsed = labelSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("discount_labels")
    .insert({ name: parsed.data.name, slug: slugify(parsed.data.name) })
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.code === "23505" ? "That label already exists." : (error?.message ?? "Could not create label.") };
  }

  revalidatePath("/admin/discounts");
  return data;
}
