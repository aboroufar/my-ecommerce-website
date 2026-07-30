"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/permissions.server";
import { TOGGLEABLE_PAYMENT_METHODS } from "@/lib/payments";

const generalSettingsSchema = z.object({
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
});

const paymentSettingsSchema = z.object({
  payment_capture_method: z.enum(["automatic", "on_fulfillment", "manual"]),
});

const TOGGLEABLE_METHOD_VALUES = TOGGLEABLE_PAYMENT_METHODS.map((m) => m.value) as [
  string,
  ...string[],
];
const paymentMethodsSettingsSchema = z.object({
  // Checkboxes only appear in FormData when checked, so getAll() naturally
  // yields just the enabled ones -- same pattern as reviews_enabled above,
  // but for a multi-value field instead of a single boolean.
  payment_methods_enabled: z.array(z.enum(TOGGLEABLE_METHOD_VALUES)).default([]),
});

const customerAccountsSettingsSchema = z.object({
  google_signin_enabled: z.preprocess((v) => v === "on", z.boolean()),
});

const shippingSettingsSchema = z.object({
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
  // Ship-from address used for every Shippo rate/label request -- optional
  // here since a store can exist before this is filled in, but the
  // "Get rates" flow in /admin/orders/[id] requires it to be complete.
  ship_from_name: z.string().optional().default(""),
  ship_from_line1: z.string().optional().default(""),
  ship_from_line2: z.string().optional().default(""),
  ship_from_city: z.string().optional().default(""),
  ship_from_region: z.string().optional().default(""),
  ship_from_postal_code: z.string().optional().default(""),
  ship_from_country: z.string().optional().default(""),
  // USPS specifically rejects a label purchase without a sender phone or
  // email, so these are collected here even though not every carrier
  // requires them.
  ship_from_phone: z.string().optional().default(""),
  ship_from_email: z.string().optional().default(""),
});

const deliveryEstimateSettingsSchema = z.object({
  delivery_estimate_enabled: z.preprocess((v) => v === "on", z.boolean()),
  fulfillment_time_days: z.coerce.number().int().min(0, "Can't be negative"),
  transit_time_min_days: z.coerce.number().int().min(0, "Can't be negative"),
  transit_time_max_days: z.coerce.number().int().min(0, "Can't be negative"),
}).refine((data) => data.transit_time_max_days >= data.transit_time_min_days, {
  message: "Maximum transit time must be greater than or equal to the minimum",
  path: ["transit_time_max_days"],
});

const categoriesMenuLabelSchema = z.object({
  categories_menu_label: z.string().min(1, "Label is required"),
});

const storeDefaultsSchema = z.object({
  order_id_prefix: z.string().optional().default(""),
  order_id_suffix: z.string().optional().default(""),
  store_currency: z.string().min(1, "Currency is required"),
  store_timezone: z.string().min(1, "Time zone is required"),
  store_unit_system: z.enum(["metric", "imperial"]),
  store_weight_unit: z.enum(["kg", "g", "lb", "oz"]),
});

const businessDetailsSchema = z.object({
  business_type: z.string().optional().default(""),
  business_legal_name: z.string().optional().default(""),
  business_country: z.string().optional().default(""),
  business_address_line1: z.string().optional().default(""),
  business_address_line2: z.string().optional().default(""),
  business_city: z.string().optional().default(""),
  business_region: z.string().optional().default(""),
  business_postal_code: z.string().optional().default(""),
  business_phone: z.string().optional().default(""),
});


export async function updateGeneralSettings(formData: FormData) {
  await requireSection("settings");

  const parsed = generalSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/general?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/general?error=${encodeURIComponent(error.message)}`);
  }

  // Site name/contact info appears in the root layout (header/footer),
  // so every page needs revalidating, not just the homepage.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/general");
  redirect("/admin/settings/general?saved=1");
}

export async function updateShippingSettings(formData: FormData) {
  await requireSection("settings");

  const parsed = shippingSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/shipping?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/shipping?error=${encodeURIComponent(error.message)}`);
  }

  // shipping_flat_rate_cents/free_shipping_threshold_cents affect checkout
  // pricing across the storefront, so revalidate broadly like the general
  // settings action does.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/shipping");
  redirect("/admin/settings/shipping?saved=1");
}

export async function updateDeliveryEstimateSettings(formData: FormData) {
  await requireSection("settings");

  const parsed = deliveryEstimateSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/shipping?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/shipping?error=${encodeURIComponent(error.message)}`);
  }

  // Read by the PDP and cart pages, not just this settings page.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/shipping");
  redirect("/admin/settings/shipping?saved=1");
}

export async function updatePaymentSettings(formData: FormData) {
  await requireSection("payments");

  const parsed = paymentSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/payments?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/payments?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/settings/payments");
  redirect("/admin/settings/payments?saved=1");
}

export async function updatePaymentMethodsSettings(formData: FormData) {
  await requireSection("payments");

  const parsed = paymentMethodsSettingsSchema.safeParse({
    payment_methods_enabled: formData.getAll("payment_methods_enabled"),
  });
  if (!parsed.success) {
    redirect(
      `/admin/settings/payments?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/payments?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/settings/payments");
  redirect("/admin/settings/payments?saved=1");
}

export async function updateCustomerAccountsSettings(formData: FormData) {
  await requireSection("customerAccounts");

  const parsed = customerAccountsSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/customer-accounts?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/customer-accounts?error=${encodeURIComponent(error.message)}`);
  }

  // google_signin_enabled is read by SignInForm.tsx on every customer
  // sign-in page across the storefront, not just one admin page.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/customer-accounts");
  redirect("/admin/settings/customer-accounts?saved=1");
}

export async function updateStoreDefaults(formData: FormData) {
  await requireSection("settings");

  const parsed = storeDefaultsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/general?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/general?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/settings/general");
  redirect("/admin/settings/general?saved=1");
}

export async function updateBusinessDetails(formData: FormData) {
  await requireSection("settings");

  const parsed = businessDetailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/settings/general?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/general?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/settings/general");
  redirect("/admin/settings/general?saved=1");
}

export async function updateCategoriesMenuLabel(formData: FormData) {
  await requireSection("menu");

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
