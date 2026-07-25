import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { decrementStockForOrder, promoteDraftOrder } from "@/lib/orderStock";

// Shared by checkout.session.completed (card / immediate methods) and
// checkout.session.async_payment_succeeded (SEPA Direct Debit and other
// delayed-notification methods) -- both fire once a session's payment has
// actually succeeded, just at different times, so both should mark the
// order paid and decrement stock the same way.
async function markOrderPaid(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error("Stripe session missing order_id metadata");
    return;
  }

  const { data: order, error: orderFetchError } = await supabase
    .from("orders")
    .select("id, status, financial_status, fulfillment_status, client_id, total_cents, currency")
    .eq("id", orderId)
    .single();

  if (orderFetchError || !order) {
    console.error("Order not found for webhook:", orderId);
    return;
  }

  // Idempotency: Stripe may retry webhook delivery, and a delayed method
  // can fire both checkout.session.completed and async_payment_succeeded
  // in some cases. If we've already marked this order paid, don't
  // decrement stock a second time.
  if (order.financial_status === "paid") return;

  const shipping = session.collected_information?.shipping_details ?? null;

  // The discount (if any) is now computed by this app before the Stripe
  // session is created and attached as a one-time session-level Coupon --
  // never a shopper-redeemed Promotion Code -- but session.amount_total
  // is still the source of truth for what Stripe actually charged, so
  // re-derive the order's final total from it rather than trusting the
  // pre-checkout figure, same "never trust a stale client-side/pre-payment
  // price" principle as the rest of checkout. The webhook event payload
  // doesn't include total_details.breakdown unless expanded, so re-fetch
  // the session with that expansion.
  const expandedSession = await getStripe().checkout.sessions.retrieve(session.id, {
    expand: ["total_details.breakdown.discounts"],
  });
  const discountCents = expandedSession.total_details?.amount_discount ?? 0;
  const promotionCode =
    expandedSession.total_details?.breakdown?.discounts?.[0]?.discount?.promotion_code;
  const promotionCodeString =
    typeof promotionCode === "string" ? promotionCode : promotionCode?.code ?? null;
  // A session-level Coupon (this app's own discount path) has no
  // associated Promotion Code, so promotionCodeString is null even when
  // a code was applied -- fall back to the code string passed through
  // session.metadata at creation time (see src/app/api/checkout/route.ts).
  const discountCodeString =
    promotionCodeString ?? (expandedSession.metadata?.discount_code || null);

  await supabase
    .from("orders")
    .update({
      // status is kept only as a deprecated mirror column (see
      // 20260812000001_financial_fulfillment_status.sql) -- nothing new
      // reads it, financial_status/fulfillment_status are the real state.
      status: "paid",
      financial_status: "paid",
      fulfillment_status: "unfulfilled",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      shipping_address: shipping ? JSON.parse(JSON.stringify(shipping)) : null,
      total_cents: expandedSession.amount_total ?? order.total_cents,
      discount_cents: discountCents,
      discount_code: discountCodeString,
    })
    .eq("id", orderId);

  // Decrement stock atomically per item via a Postgres function, so
  // concurrent orders for the same product can't both read the same
  // stock_qty and oversell it (a plain read-then-write from here would
  // have that race condition). Variant line items decrement the
  // variant's own stock_qty via a separate function instead of the
  // parent product's -- decrement_stock itself is untouched. Shared with
  // the draft-order promotion path in src/lib/orderStock.ts so this
  // logic isn't duplicated.
  const orderItems = await decrementStockForOrder(supabase, orderId);

  // Send order confirmation email. Failure here is only logged, never
  // thrown -- an email hiccup shouldn't cause Stripe to retry a webhook
  // for an order that already succeeded and already decremented stock.
  const customerEmail = session.customer_details?.email;
  if (customerEmail) {
    const siteUrl = process.env.SITE_URL;
    const orderUrl =
      order.client_id && siteUrl
        ? `${siteUrl}/account/orders/${orderId}`
        : undefined;

    const totalCents = expandedSession.amount_total ?? order.total_cents;

    await sendOrderConfirmationEmail({
      to: customerEmail,
      orderId,
      items: (orderItems ?? []).map((item) => ({
        name: item.variant_label
          ? `${item.product_name} — ${item.variant_label}`
          : item.product_name,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
      })),
      totalCents,
      currency: order.currency,
      orderUrl,
    });
  }
}

// Route handlers need the raw body for Stripe signature verification --
// don't add any body-parsing middleware in front of this route.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // For delayed-notification payment methods (SEPA Direct Debit, some
      // bank redirects), the session can "complete" while the underlying
      // payment is still processing -- payment_status stays "unpaid" until
      // the async result lands, at which point Stripe sends
      // checkout.session.async_payment_succeeded/failed instead. Only mark
      // the order paid here when Stripe confirms the money has actually
      // arrived; otherwise leave it "pending" for that later event to
      // resolve. Cards and other immediate methods are always "paid" by
      // the time this event fires, so their behavior is unchanged.
      if (session.payment_status === "paid") {
        await handleCheckoutSessionPaid(supabase, session);
      }
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionPaid(supabase, session);
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled", financial_status: "voided", fulfillment_status: "cancelled" })
          .eq("id", orderId)
          .eq("financial_status", "pending"); // don't cancel an order that already paid
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled", financial_status: "voided", fulfillment_status: "cancelled" })
          .eq("id", orderId)
          .eq("financial_status", "pending"); // don't cancel an order that already paid
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await reconcileStripeRefund(supabase, charge);
      break;
    }

    default:
      // Unhandled event types are fine to ignore.
      break;
  }

  return NextResponse.json({ received: true });
}

/**
 * A checkout.session.completed/async_payment_succeeded session either
 * belongs to a normal checkout (session.metadata.order_id, an orders
 * row already exists) or to a draft order's Stripe Payment Link
 * (session.metadata.draft_order_id, no orders row exists yet -- it's
 * created here by promoting the draft). Payment Links are session
 * factories, so they fire the exact same event types as a normal
 * checkout; this is the only branch needed to route between the two.
 */
async function handleCheckoutSessionPaid(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const draftOrderId = session.metadata?.draft_order_id;
  if (draftOrderId && !session.metadata?.order_id) {
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    const result = await promoteDraftOrder(supabase, draftOrderId, {
      stripePaymentIntentId: paymentIntentId,
      customerEmail: session.customer_details?.email,
    });
    if ("error" in result) {
      console.error("promoteDraftOrder failed for draft order", draftOrderId, result.error);
    }
    return;
  }

  await markOrderPaid(supabase, session);
}

/**
 * Handles refunds initiated from the Stripe Dashboard directly
 * (bypassing this app's own admin refund action in
 * src/lib/actions/refunds.ts). Idempotency: this app's own createRefund
 * action always inserts its `refunds` row (with stripe_refund_id set)
 * before Stripe's webhook can plausibly arrive, so checking for an
 * existing row with that stripe_refund_id and no-oping if found means
 * a Dashboard-initiated refund never double-inserts against one this
 * app already recorded. No line-item breakdown or restock happens
 * here -- a Dashboard-initiated refund has no order_item association --
 * only the header-level refunds row and financial_status are
 * reconciled.
 */
async function reconcileStripeRefund(
  supabase: ReturnType<typeof createAdminClient>,
  charge: Stripe.Charge
) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_cents, financial_status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();
  if (!order) return;

  for (const refund of charge.refunds?.data ?? []) {
    const { data: existing } = await supabase
      .from("refunds")
      .select("id")
      .eq("stripe_refund_id", refund.id)
      .maybeSingle();
    if (existing) continue; // already recorded by this app's own createRefund action

    await supabase.from("refunds").insert({
      order_id: order.id,
      amount_cents: refund.amount,
      reason: refund.reason ?? "Refunded via Stripe Dashboard",
      stripe_refund_id: refund.id,
      created_by_email: null, // Dashboard-initiated, no in-app admin identity
    });
  }

  const totalRefundedCents = charge.amount_refunded ?? 0;
  const newFinancialStatus =
    totalRefundedCents >= order.total_cents
      ? "refunded"
      : totalRefundedCents > 0
        ? "partially_refunded"
        : order.financial_status;

  if (newFinancialStatus === "refunded") {
    // status is kept only as a deprecated mirror column.
    await supabase
      .from("orders")
      .update({ financial_status: newFinancialStatus, status: "refunded" })
      .eq("id", order.id);
  } else {
    await supabase.from("orders").update({ financial_status: newFinancialStatus }).eq("id", order.id);
  }
}
