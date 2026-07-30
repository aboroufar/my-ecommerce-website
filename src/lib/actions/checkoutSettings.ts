"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/permissions.server";
import { checkoutSettingsSchema, type CheckoutSettings } from "@/lib/checkoutSettings";

/**
 * Custom fields arrive as repeatable indexed form fields (custom_fields[0]
 * [label], custom_fields[0][type], ...) rather than a single array input --
 * there's no native browser way to submit a dynamic-length array of
 * objects from a plain <form>. Parsed back into an array here, one entry
 * per index found, in index order.
 */
function parseCustomFieldsFromFormData(formData: FormData): CheckoutSettings["customFields"] {
  const indices = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^custom_fields\[(\d+)\]/);
    if (match) indices.add(Number(match[1]));
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((i) => {
      const type = formData.get(`custom_fields[${i}][type]`);
      const dropdownRaw = formData.get(`custom_fields[${i}][dropdownOptions]`);
      return {
        key: String(formData.get(`custom_fields[${i}][key]`) ?? ""),
        label: String(formData.get(`custom_fields[${i}][label]`) ?? ""),
        type: type === "numeric" || type === "dropdown" ? type : "text",
        required: formData.get(`custom_fields[${i}][required]`) === "on",
        dropdownOptions:
          typeof dropdownRaw === "string"
            ? dropdownRaw
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
            : [],
      };
    });
}

export async function updateCheckoutSettings(formData: FormData) {
  await requireSection("checkout");

  const parsed = checkoutSettingsSchema.safeParse({
    requirePhoneNumber: formData.get("requirePhoneNumber") === "on",
    billingAddressCollection: formData.get("billingAddressCollection") === "required" ? "required" : "auto",
    requireTermsAcceptance: formData.get("requireTermsAcceptance") === "on",
    termsUrl: formData.get("termsUrl") ?? "",
    customFields: parseCustomFieldsFromFormData(formData),
  });

  if (!parsed.success) {
    redirect(
      `/admin/settings/checkout?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  // Custom field keys must be unique -- Stripe rejects duplicates outright,
  // so catch it here with a clearer message rather than letting checkout
  // fail later for a shopper.
  const keys = parsed.data.customFields.map((f) => f.key);
  if (new Set(keys).size !== keys.length) {
    redirect(
      `/admin/settings/checkout?error=${encodeURIComponent("Custom field keys must be unique.")}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ checkout_settings: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    redirect(`/admin/settings/checkout?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/settings/checkout");
  redirect("/admin/settings/checkout?saved=1");
}
