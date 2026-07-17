"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

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

// Discount codes are now redeemed on Stripe's own hosted Checkout page
// (allow_promotion_codes), so every row needs a live Stripe Coupon +
// Promotion Code to actually validate there. Coupons are immutable on
// Stripe once created, so an edit that changes type/value/code can't
// just update the existing objects -- it deactivates the old Promotion
// Code (Stripe coupons/promo codes can't be deleted, only archived) and
// creates a fresh pair, same one-time-object pattern already used for
// checkout-time coupons in src/app/api/checkout/route.ts.
async function syncStripePromotionCode(
  discount: { code: string; type: string; value: number; active: boolean; expires_at: string | null }
): Promise<{ stripe_coupon_id: string | null; stripe_promotion_code_id: string | null }> {
  if (!discount.active) {
    return { stripe_coupon_id: null, stripe_promotion_code_id: null };
  }

  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    duration: "forever",
    ...(discount.type === "percent"
      ? { percent_off: discount.value }
      : { amount_off: discount.value, currency: "eur" }),
  });

  const promotionCode = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: discount.code,
    ...(discount.expires_at
      ? { expires_at: Math.floor(new Date(discount.expires_at).getTime() / 1000) }
      : {}),
  });

  return { stripe_coupon_id: coupon.id, stripe_promotion_code_id: promotionCode.id };
}

async function archiveStripePromotionCode(promotionCodeId: string | null) {
  if (!promotionCodeId) return;
  const stripe = getStripe();
  await stripe.promotionCodes.update(promotionCodeId, { active: false }).catch(() => {});
}

export async function createDiscountCode(formData: FormData) {
  await requireAdmin();

  const parsed = discountCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/discounts?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const stripeIds = await syncStripePromotionCode(parsed.data).catch(() => null);
  if (!stripeIds) {
    redirect(`/admin/discounts?error=${encodeURIComponent("Could not create this code on Stripe.")}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("discount_codes")
    .insert({ ...parsed.data, ...stripeIds });

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

  const { data: existing } = await supabase
    .from("discount_codes")
    .select("stripe_promotion_code_id")
    .eq("id", id)
    .maybeSingle();

  await archiveStripePromotionCode(existing?.stripe_promotion_code_id ?? null);

  const stripeIds = await syncStripePromotionCode(parsed.data).catch(() => null);
  if (!stripeIds) {
    redirect(`/admin/discounts?edit=${id}&error=${encodeURIComponent("Could not update this code on Stripe.")}`);
  }

  const { error } = await supabase
    .from("discount_codes")
    .update({ ...parsed.data, ...stripeIds })
    .eq("id", id);

  if (error) redirect(`/admin/discounts?edit=${id}&error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function deleteDiscountCode(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("discount_codes")
    .select("stripe_promotion_code_id")
    .eq("id", id)
    .maybeSingle();

  await archiveStripePromotionCode(existing?.stripe_promotion_code_id ?? null);
  await supabase.from("discount_codes").delete().eq("id", id);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function toggleDiscountCode(id: string, active: boolean) {
  await requireAdmin();

  const supabase = createAdminClient();
  const nextActive = !active;

  const { data: existing } = await supabase
    .from("discount_codes")
    .select("code, type, value, expires_at, stripe_promotion_code_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) redirect("/admin/discounts");

  if (nextActive) {
    // Re-activating: the old Promotion Code was archived (Stripe can't
    // un-archive one), so mint a fresh coupon/promo pair.
    const stripeIds = await syncStripePromotionCode({ ...existing, active: true }).catch(() => null);
    await supabase
      .from("discount_codes")
      .update({ active: true, ...(stripeIds ?? {}) })
      .eq("id", id);
  } else {
    await archiveStripePromotionCode(existing.stripe_promotion_code_id);
    await supabase.from("discount_codes").update({ active: false }).eq("id", id);
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}
