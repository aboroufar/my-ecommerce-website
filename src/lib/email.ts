import { Resend } from "resend";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "RESEND_API_KEY is not set. Add it to .env.local (and Vercel env vars)."
      );
    }
    resend = new Resend(key);
  }
  return resend;
}

// Resend's test/sandbox sender -- works with zero setup but can only send
// to your own verified account email. Swap for a verified sender on your
// own domain (e.g. "Storefront <orders@yourdomain.com>") once you've added
// and verified a domain in the Resend dashboard. See EMAIL.md.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Storefront <onboarding@resend.dev>";

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  totalCents: number;
  currency: string;
  orderUrl?: string;
}) {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: `Order confirmed — #${params.orderId.slice(0, 8)}`,
      react: OrderConfirmationEmail({
        orderId: params.orderId,
        items: params.items,
        totalCents: params.totalCents,
        currency: params.currency,
        orderUrl: params.orderUrl,
      }),
    });
    if (error) {
      console.error("Resend returned an error sending order confirmation:", error);
    }
  } catch (err) {
    // Deliberately swallow: by the time this runs, payment has already
    // succeeded and stock is already decremented. A failed email should
    // never roll back or fail the webhook -- that would cause Stripe to
    // retry the whole event, re-running an already-completed order.
    console.error("sendOrderConfirmationEmail failed:", err);
  }
}
