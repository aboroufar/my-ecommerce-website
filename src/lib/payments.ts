import type Stripe from "stripe";

type PaymentMethodType = Stripe.Checkout.SessionCreateParams.PaymentMethodType;

/**
 * Stripe Checkout payment_method_types this app lets the store toggle from
 * /admin/settings/payments. "card" isn't in this list -- it's always
 * force-included at checkout (src/app/api/checkout/route.ts), same as
 * Shopify never lets a store turn off card payments entirely.
 */
export const TOGGLEABLE_PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: "paypal", label: "PayPal" },
  { value: "klarna", label: "Klarna" },
  { value: "satispay", label: "Satispay" },
];

const TOGGLEABLE_VALUES: string[] = TOGGLEABLE_PAYMENT_METHODS.map((m) => m.value);

/**
 * Builds the payment_method_types array passed to
 * stripe.checkout.sessions.create -- "card" first and always present,
 * followed by whichever of site_settings.payment_methods_enabled are
 * recognized toggleable methods (silently drops anything stale/unknown
 * rather than erroring, since this list is admin-editable data, not code).
 */
export function resolvePaymentMethodTypes(
  enabled: string[] | null | undefined
): PaymentMethodType[] {
  const known = (enabled ?? []).filter((m): m is PaymentMethodType =>
    TOGGLEABLE_VALUES.includes(m)
  );
  return ["card", ...known];
}
