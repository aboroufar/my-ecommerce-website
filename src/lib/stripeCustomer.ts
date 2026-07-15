import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getStripe } from "@/lib/stripe";

/**
 * Returns the Stripe Customer id for a signed-in shopper, creating one on
 * Stripe (and persisting it) the first time. Reusing one Customer per
 * shopper is what lets Stripe Checkout pre-fill a saved shipping address --
 * there's no way to pass an address directly into session creation.
 */
export async function getOrCreateStripeCustomer(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string | undefined
): Promise<string> {
  const { data: customer } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (customer?.stripe_customer_id) {
    return customer.stripe_customer_id;
  }

  const stripeCustomer = await getStripe().customers.create({
    email,
    metadata: { customer_id: userId },
  });

  await supabase
    .from("customers")
    .update({ stripe_customer_id: stripeCustomer.id })
    .eq("id", userId);

  return stripeCustomer.id;
}
