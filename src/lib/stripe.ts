import Stripe from "stripe";

let stripe: Stripe | null = null;

/**
 * Lazily-initialized Stripe client. Lazy so that a missing STRIPE_SECRET_KEY
 * only breaks checkout/webhook routes when actually called, not the whole
 * build.
 */
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to .env.local (and Vercel env vars)."
      );
    }
    stripe = new Stripe(key);
  }
  return stripe;
}
