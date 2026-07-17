import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
    .select("id, status, customer_id, total_cents, currency")
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
  if (order.status === "paid") return;

  const shipping = session.collected_information?.shipping_details ?? null;

  // A discount code is now redeemed on Stripe's own hosted page
  // (allow_promotion_codes) rather than applied when the order row was
  // first created, so the order's total_cents at creation time never
  // reflects it. session.amount_total is what Stripe actually charged --
  // always re-derive the order's final total from it here rather than
  // trusting the pre-checkout figure, same "never trust a stale
  // client-side/pre-payment price" principle as the rest of checkout.
  // The webhook event payload doesn't include total_details.breakdown
  // unless expanded, so re-fetch the session with that expansion to read
  // back which promotion code (if any) was actually redeemed.
  const expandedSession = await getStripe().checkout.sessions.retrieve(session.id, {
    expand: ["total_details.breakdown.discounts"],
  });
  const discountCents = expandedSession.total_details?.amount_discount ?? 0;
  const promotionCode =
    expandedSession.total_details?.breakdown?.discounts?.[0]?.discount?.promotion_code;
  const promotionCodeString =
    typeof promotionCode === "string" ? promotionCode : promotionCode?.code ?? null;

  await supabase
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      shipping_address: shipping ? JSON.parse(JSON.stringify(shipping)) : null,
      total_cents: expandedSession.amount_total ?? order.total_cents,
      discount_cents: discountCents,
      discount_code: promotionCodeString,
    })
    .eq("id", orderId);

  // Decrement stock atomically per item via a Postgres function, so
  // concurrent orders for the same product can't both read the same
  // stock_qty and oversell it (a plain read-then-write from here would
  // have that race condition). Variant line items decrement the
  // variant's own stock_qty via a separate function instead of the
  // parent product's -- decrement_stock itself is untouched.
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, unit_price_cents, variant_id, variant_label")
    .eq("order_id", orderId);

  for (const item of orderItems ?? []) {
    if (item.variant_id) {
      const { data: ok, error: rpcError } = await supabase.rpc(
        "decrement_variant_stock",
        { item_variant_id: item.variant_id, item_quantity: item.quantity }
      );
      if (rpcError) {
        console.error("decrement_variant_stock failed:", rpcError.message);
      } else if (!ok) {
        console.warn(
          `Stock insufficient for variant ${item.variant_id} on order ${orderId} -- needs manual review.`
        );
      }
      continue;
    }

    if (!item.product_id) continue;
    const { data: ok, error: rpcError } = await supabase.rpc(
      "decrement_stock",
      { item_product_id: item.product_id, item_quantity: item.quantity }
    );
    if (rpcError) {
      console.error("decrement_stock failed:", rpcError.message);
    } else if (!ok) {
      // Insufficient stock at fulfillment time (e.g. oversold by a
      // near-simultaneous order). Payment already succeeded, so this
      // needs manual follow-up rather than silently going negative.
      console.warn(
        `Stock insufficient for product ${item.product_id} on order ${orderId} -- needs manual review.`
      );
    }
  }

  // Send order confirmation email. Failure here is only logged, never
  // thrown -- an email hiccup shouldn't cause Stripe to retry a webhook
  // for an order that already succeeded and already decremented stock.
  const customerEmail = session.customer_details?.email;
  if (customerEmail) {
    const siteUrl = process.env.SITE_URL;
    const orderUrl =
      order.customer_id && siteUrl
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
        await markOrderPaid(supabase, session);
      }
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markOrderPaid(supabase, session);
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending"); // don't cancel an order that already paid
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending"); // don't cancel an order that already paid
      }
      break;
    }

    default:
      // Unhandled event types are fine to ignore.
      break;
  }

  return NextResponse.json({ received: true });
}
