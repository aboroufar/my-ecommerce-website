"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { discountConfigSchema, type DiscountConfig } from "@/lib/discounts";
import type { Json } from "@/lib/supabase/types";

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

const discountFormSchema = z.object({
  discount_type: z.enum(["amount_off_products", "buy_x_get_y", "amount_off_order", "free_shipping"]),
  configJson: z.string().min(1, "Configuration is required"),
  // Checkboxes are only present in FormData when checked ("on"), so a
  // missing key means unchecked/false rather than a validation failure.
  active: z.preprocess((v) => v === "on", z.boolean()),
  starts_at: z.string().min(1, "Start date is required"),
  expires_at: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
});

function parseConfig(configJson: string): DiscountConfig | null {
  try {
    const raw = JSON.parse(configJson);
    const result = discountConfigSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// discount_codes.type/.value are deprecated legacy columns (still NOT
// NULL at the DB level -- see supabase/migrations/20260803000001_...sql)
// -- every new write supplies a value derived from config so the
// constraint is satisfied, but nothing reads these columns anymore.
function legacyTypeAndValue(config: DiscountConfig): { type: "percent" | "fixed"; value: number } {
  if (config.discount_type === "free_shipping") return { type: "fixed", value: 0 };
  if (config.discount_type === "buy_x_get_y") return { type: config.get.valueType, value: config.get.value };
  return { type: config.valueType, value: config.value };
}

// Discount codes are redeemed on this app's own cart page (validated
// server-side against the full config), then applied to the Stripe
// Checkout Session as a one-time coupon computed per checkout -- see
// src/app/api/checkout/route.ts. A live Stripe Coupon + Promotion Code
// is kept as a legacy compat object only; the checkout route never
// redeems it directly, it just needs *a* record to exist for any
// external reference. Coupons/promo codes are immutable on Stripe once
// created, so an edit that changes the code/value can't just update the
// existing objects -- it archives the old Promotion Code (Stripe
// coupons/promo codes can't be deleted, only archived) and creates a
// fresh pair.
async function syncStripePromotionCode(
  discount: { code: string; valueType: "percent" | "fixed"; value: number; active: boolean; expires_at: string | null }
): Promise<{ stripe_coupon_id: string | null; stripe_promotion_code_id: string | null }> {
  if (!discount.active) {
    return { stripe_coupon_id: null, stripe_promotion_code_id: null };
  }

  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    duration: "forever",
    ...(discount.valueType === "percent"
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

  const parsed = discountFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/discounts/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const config = parseConfig(parsed.data.configJson);
  if (!config) {
    redirect(`/admin/discounts/new?error=${encodeURIComponent("Invalid discount configuration")}`);
  }

  let stripeIds = { stripe_coupon_id: null as string | null, stripe_promotion_code_id: null as string | null };
  if (config.method === "code") {
    const { type: valueType, value } = legacyTypeAndValue(config);
    const synced = await syncStripePromotionCode({
      code: config.code!,
      valueType,
      value,
      active: parsed.data.active,
      expires_at: parsed.data.expires_at,
    }).catch(() => null);
    if (!synced) {
      redirect(`/admin/discounts/new?error=${encodeURIComponent("Could not create this code on Stripe.")}`);
    }
    stripeIds = synced;
  }

  const legacy = legacyTypeAndValue(config);
  const supabase = createAdminClient();
  const { error } = await supabase.from("discount_codes").insert({
    code: config.code ?? config.discount_type,
    discount_type: config.discount_type,
    config: config as unknown as Json,
    type: legacy.type,
    value: legacy.value,
    active: parsed.data.active,
    starts_at: parsed.data.starts_at,
    expires_at: parsed.data.expires_at,
    ...stripeIds,
  });

  if (error) redirect(`/admin/discounts/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function updateDiscountCode(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = discountFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/discounts/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const config = parseConfig(parsed.data.configJson);
  if (!config) {
    redirect(`/admin/discounts/${id}/edit?error=${encodeURIComponent("Invalid discount configuration")}`);
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("discount_codes")
    .select("stripe_promotion_code_id")
    .eq("id", id)
    .maybeSingle();

  await archiveStripePromotionCode(existing?.stripe_promotion_code_id ?? null);

  let stripeIds = { stripe_coupon_id: null as string | null, stripe_promotion_code_id: null as string | null };
  if (config.method === "code") {
    const { type: valueType, value } = legacyTypeAndValue(config);
    const synced = await syncStripePromotionCode({
      code: config.code!,
      valueType,
      value,
      active: parsed.data.active,
      expires_at: parsed.data.expires_at,
    }).catch(() => null);
    if (!synced) {
      redirect(`/admin/discounts/${id}/edit?error=${encodeURIComponent("Could not update this code on Stripe.")}`);
    }
    stripeIds = synced;
  }

  const legacy = legacyTypeAndValue(config);
  const { error } = await supabase
    .from("discount_codes")
    .update({
      code: config.code ?? config.discount_type,
      discount_type: config.discount_type,
      config: config as unknown as Json,
      type: legacy.type,
      value: legacy.value,
      active: parsed.data.active,
      starts_at: parsed.data.starts_at,
      expires_at: parsed.data.expires_at,
      ...stripeIds,
    })
    .eq("id", id);

  if (error) redirect(`/admin/discounts/${id}/edit?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/discounts");
  revalidatePath(`/admin/discounts/${id}/edit`);
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
    .select("code, config, expires_at, stripe_promotion_code_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) redirect("/admin/discounts");

  const config = existing.config as unknown as DiscountConfig;

  if (nextActive) {
    if (config.method === "code") {
      // Re-activating: the old Promotion Code was archived (Stripe can't
      // un-archive one), so mint a fresh coupon/promo pair.
      const { type: valueType, value } = legacyTypeAndValue(config);
      const stripeIds = await syncStripePromotionCode({
        code: existing.code,
        valueType,
        value,
        active: true,
        expires_at: existing.expires_at,
      }).catch(() => null);
      await supabase
        .from("discount_codes")
        .update({ active: true, ...(stripeIds ?? {}) })
        .eq("id", id);
    } else {
      await supabase.from("discount_codes").update({ active: true }).eq("id", id);
    }
  } else {
    await archiveStripePromotionCode(existing.stripe_promotion_code_id);
    await supabase.from("discount_codes").update({ active: false }).eq("id", id);
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}
