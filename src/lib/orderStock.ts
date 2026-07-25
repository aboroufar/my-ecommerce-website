import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Atomically decrements stock for every line item on a paid order, one
 * RPC call per line (decrement_variant_stock for variant lines,
 * decrement_stock otherwise) -- lifted verbatim out of the Stripe
 * webhook's markOrderPaid so the same logic can run from a draft
 * order's cash/comp payment path without copy-pasting it. Insufficient
 * stock is only logged (payment already succeeded, so this needs
 * manual follow-up rather than blocking or throwing).
 */
export async function decrementStockForOrder(supabase: AdminClient, orderId: string) {
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, unit_price_cents, variant_id, variant_label")
    .eq("order_id", orderId);

  for (const item of orderItems ?? []) {
    if (item.variant_id) {
      const { data: ok, error: rpcError } = await supabase.rpc("decrement_variant_stock", {
        item_variant_id: item.variant_id,
        item_quantity: item.quantity,
      });
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
    const { data: ok, error: rpcError } = await supabase.rpc("decrement_stock", {
      item_product_id: item.product_id,
      item_quantity: item.quantity,
    });
    if (rpcError) {
      console.error("decrement_stock failed:", rpcError.message);
    } else if (!ok) {
      console.warn(
        `Stock insufficient for product ${item.product_id} on order ${orderId} -- needs manual review.`
      );
    }
  }

  return orderItems ?? [];
}

/**
 * Promotes a draft order to a real order -- the single code path used
 * both by a cash/comp "mark as paid" admin action and by the Stripe
 * webhook when a sent Payment Link is completed. Creates the real
 * orders/order_items rows from the draft's own snapshot (never
 * re-trusting anything from the request that triggered this -- the
 * draft's own DB rows are the source of truth here, same as checkout
 * always re-fetches canonical prices rather than trusting the client),
 * decrements stock via decrementStockForOrder, marks the draft
 * completed with a converted_order_id back-reference, and sends the
 * same order confirmation email a normal checkout sends.
 *
 * Idempotent: no-ops if the draft is already completed, so a retried
 * webhook delivery or a double click can't promote the same draft
 * twice.
 */
export async function promoteDraftOrder(
  supabase: AdminClient,
  draftOrderId: string,
  options: { stripePaymentIntentId: string | null; customerEmail?: string | null }
): Promise<{ orderId: string } | { error: string }> {
  const { data: draftOrder } = await supabase
    .from("draft_orders")
    .select("id, status, client_id, guest_name, guest_email, subtotal_cents, shipping_cents, total_cents, currency")
    .eq("id", draftOrderId)
    .single();

  if (!draftOrder) return { error: "Draft order not found." };
  if (draftOrder.status === "completed") {
    // Already promoted (retried webhook or double submission) -- return
    // the order it was already converted into rather than erroring.
    const { data: existing } = await supabase
      .from("draft_orders")
      .select("converted_order_id")
      .eq("id", draftOrderId)
      .single();
    return existing?.converted_order_id
      ? { orderId: existing.converted_order_id }
      : { error: "Draft order already completed but has no linked order." };
  }

  const { data: draftItems } = await supabase
    .from("draft_order_items")
    .select("product_id, product_name, quantity, unit_price_cents, variant_id, variant_label")
    .eq("draft_order_id", draftOrderId);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      client_id: draftOrder.client_id,
      financial_status: "paid",
      fulfillment_status: "unfulfilled",
      status: "paid",
      total_cents: draftOrder.total_cents,
      shipping_cents: draftOrder.shipping_cents,
      currency: draftOrder.currency,
      stripe_payment_intent_id: options.stripePaymentIntentId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Could not create the order." };
  }

  if (draftItems && draftItems.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      draftItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        variant_id: item.variant_id,
        variant_label: item.variant_label,
      }))
    );
    if (itemsError) {
      // Roll back the order row rather than leaving a paid order with no
      // line items -- same "delete on failure" discipline as checkout's
      // own Stripe-session-creation rollback.
      await supabase.from("orders").delete().eq("id", order.id);
      return { error: itemsError.message };
    }
  }

  await supabase
    .from("draft_orders")
    .update({ status: "completed", converted_order_id: order.id })
    .eq("id", draftOrderId);

  const orderItems = await decrementStockForOrder(supabase, order.id);

  const customerEmail = options.customerEmail ?? draftOrder.guest_email;
  if (customerEmail) {
    const siteUrl = process.env.SITE_URL;
    const orderUrl =
      draftOrder.client_id && siteUrl ? `${siteUrl}/account/orders/${order.id}` : undefined;

    await sendOrderConfirmationEmail({
      to: customerEmail,
      orderId: order.id,
      items: orderItems.map((item) => ({
        name: item.variant_label ? `${item.product_name} — ${item.variant_label}` : item.product_name,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
      })),
      totalCents: draftOrder.total_cents,
      currency: draftOrder.currency,
      orderUrl,
    });
  }

  return { orderId: order.id };
}
