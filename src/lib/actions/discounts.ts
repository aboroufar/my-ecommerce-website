"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const discountCodeSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code is required")
      .transform((v) => v.trim().toUpperCase()),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().positive("Value must be a positive number"),
    // Checkboxes are only present in FormData when checked ("on"), so a
    // missing key means unchecked/false rather than a validation failure.
    active: z.preprocess((v) => v === "on", z.boolean()),
    expires_at: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((data) => data.type !== "percent" || data.value <= 100, {
    message: "Percent value can't exceed 100",
    path: ["value"],
  });

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function createDiscountCode(formData: FormData) {
  await requireAdmin();

  const parsed = discountCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/discounts?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("discount_codes").insert(parsed.data);

  if (error) redirect(`/admin/discounts?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function updateDiscountCode(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = discountCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/discounts?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("discount_codes").update(parsed.data).eq("id", id);

  if (error) redirect(`/admin/discounts?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function deleteDiscountCode(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("discount_codes").delete().eq("id", id);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function toggleDiscountCode(id: string, active: boolean) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("discount_codes").update({ active: !active }).eq("id", id);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}
