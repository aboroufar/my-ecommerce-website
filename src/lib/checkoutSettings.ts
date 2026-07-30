import { z } from "zod";
import type Stripe from "stripe";

/**
 * Everything here maps directly onto real Stripe Checkout Session params
 * (see resolveCheckoutSessionOptions below) -- this app's checkout is
 * Stripe's hosted page, not a custom-built form, so "customize checkout"
 * is scoped to what Stripe Checkout itself exposes: which contact/address
 * fields to collect, up to 3 custom fields, and a Terms of Service consent
 * checkbox. It does not control layout/branding beyond Stripe's own
 * Branding settings (dashboard.stripe.com/settings/branding).
 */
export const customFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Key must be alphanumeric (dashes/underscores allowed)"),
  label: z.string().min(1, "Label is required").max(50),
  type: z.enum(["text", "numeric", "dropdown"]),
  required: z.boolean().default(false),
  // Only meaningful when type is "dropdown" -- newline-separated in the
  // admin form, split into Stripe's {label, value}[] shape at save time.
  dropdownOptions: z.array(z.string().min(1)).max(200).optional(),
});
export type CustomFieldSetting = z.infer<typeof customFieldSchema>;

export const checkoutSettingsSchema = z.object({
  requirePhoneNumber: z.boolean().default(false),
  billingAddressCollection: z.enum(["auto", "required"]).default("auto"),
  requireTermsAcceptance: z.boolean().default(false),
  termsUrl: z.string().max(500).optional().default(""),
  customFields: z.array(customFieldSchema).max(3).default([]),
});
export type CheckoutSettings = z.infer<typeof checkoutSettingsSchema>;

const DEFAULT_SETTINGS: CheckoutSettings = {
  requirePhoneNumber: false,
  billingAddressCollection: "auto",
  requireTermsAcceptance: false,
  termsUrl: "",
  customFields: [],
};

/**
 * Parses the site_settings.checkout_settings jsonb column, falling back to
 * defaults on missing/invalid data rather than throwing -- checkout must
 * never break because of a malformed settings row.
 */
export function parseCheckoutSettings(raw: unknown): CheckoutSettings {
  const result = checkoutSettingsSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_SETTINGS;
}

/**
 * Builds the subset of stripe.checkout.sessions.create params controlled
 * by these settings. Merged into the rest of the session params by the
 * caller (src/app/api/checkout/route.ts) via spread.
 */
export function resolveCheckoutSessionOptions(
  settings: CheckoutSettings
): Pick<
  Stripe.Checkout.SessionCreateParams,
  "phone_number_collection" | "billing_address_collection" | "consent_collection" | "custom_fields" | "custom_text"
> {
  const customFields: Stripe.Checkout.SessionCreateParams.CustomField[] = settings.customFields.map(
    (field) => {
      const label: Stripe.Checkout.SessionCreateParams.CustomField.Label = {
        type: "custom",
        custom: field.label,
      };
      if (field.type === "dropdown") {
        return {
          key: field.key,
          label,
          type: "dropdown",
          optional: !field.required,
          dropdown: {
            options: (field.dropdownOptions ?? []).map((opt) => ({ label: opt, value: opt })),
          },
        };
      }
      return {
        key: field.key,
        label,
        type: field.type,
        optional: !field.required,
      };
    }
  );

  return {
    phone_number_collection: { enabled: settings.requirePhoneNumber },
    billing_address_collection: settings.billingAddressCollection,
    custom_fields: customFields,
    ...(settings.requireTermsAcceptance
      ? {
          consent_collection: { terms_of_service: "required" as const },
          custom_text: {
            terms_of_service_acceptance: {
              // Stripe requires a message here when terms_of_service is
              // "required". Plain text only -- Stripe's custom_text fields
              // don't document markdown/link support, so termsUrl is kept
              // as a separate stored field (surfaced on /admin/settings
              // /checkout) rather than embedded here.
              message: "I agree to the Terms of Service",
            },
          },
        }
      : {}),
  };
}
