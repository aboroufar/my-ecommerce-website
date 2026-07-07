import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";

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
      const orderId = session.metadata?.order_id;
      if (!orderId) {
        console.error("checkout.session.completed missing order_id metadata");
        break;
      }

      const { data: order, error: orderFetchError } = await supabase
        .from("orders")
        .select("id, status, customer_id, total_cents, currency")
        .eq("id", orderId)
        .single();

      if (orderFetchError || !order) {
        console.error("Order not found for webhook:", orderId);
        break;
      }

      // Idempotency: Stripe may retry webhook delivery. If we've already
      // marked this order paid, don't decrement stock a second time.
      if (order.status === "paid") break;

      const shipping = session.collected_information?.shipping_details ?? null;

      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          shipping_address: shipping ? JSON.parse(JSON.stringify(shipping)) : null,
        })
        .eq("id", orderId);

      // Decrement stock atomically per item via a Postgres function, so
      // concurrent orders for the same product can't both read the same
      // stock_qty and oversell it (a plain read-then-write from here would
      // have that race condition).
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, unit_price_cents")
        .eq("order_id", orderId);

      for (const item of orderItems ?? []) {
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

        const totalCents = order.total_cents;

        await sendOrderConfirmationEmail({
          to: customerEmail,
          orderId,
          items: (orderItems ?? []).map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
            unitPriceCents: item.unit_price_cents,
          })),
          totalCents,
          currency: order.currency,
          orderUrl,
        });
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
