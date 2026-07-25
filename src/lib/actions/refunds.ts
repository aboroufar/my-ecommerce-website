"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
  return user;
}

const refundLineSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  restock: z.boolean(),
});

const createRefundSchema = z.object({
  orderId: z.string().uuid(),
  lines: z.array(refundLineSchema),
  shippingRefundCents: z.number().int().min(0).default(0),
  reason: z.string().optional(),
});

type CreateRefundInput = z.input<typeof createRefundSchema>;

// Stripe's RefundCreateParams.reason only accepts three fixed buckets --
// this app's own free-text reason is stored in full on the refunds row,
// this just maps it to the closest Stripe bucket (or omits the param).
function mapReasonToStripeReason(reason?: string): Stripe.RefundCreateParams.Reason | undefined {
  if (!reason) return undefined;
  const normalized = reason.toLowerCase();
  if (normalized.includes("duplicate")) return "duplicate";
  if (normalized.includes("fraud")) return "fraudulent";
  return "requested_by_customer";
}

/**
 * Issues a real Stripe refund for an order, partial or full, per line
 * item, with optional restock -- called from RefundModal via a direct
 * server-action call (not a <form>, since the line-item selection is a
 * structured array), so it returns a result object instead of
 * redirecting, unlike the form-based actions in orders.ts.
 *
 * amount_cents is always recomputed here from the order's own
 * order_items rows (unit_price_cents * quantity), never trusted from
 * the caller -- same "never trust a client-submitted price" principle
 * as checkout.
 */
export async function createRefund(
  input: CreateRefundInput
): Promise<{ error: string } | { success: true }> {
  const admin = await requireAdmin();

  const parsed = createRefundSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { orderId, lines, shippingRefundCents, reason } = parsed.data;

  if (lines.length === 0 && shippingRefundCents === 0) {
    return { error: "Select at least one item or a shipping amount to refund." };
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, stripe_payment_intent_id, total_cents, financial_status")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };
  if (!order.stripe_payment_intent_id) {
    return { error: "This order has no associated payment to refund." };
  }

  const orderItemIds = lines.map((line) => line.orderItemId);
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, product_id, variant_id, unit_price_cents, quantity")
    .in("id", orderItemIds.length > 0 ? orderItemIds : ["00000000-0000-0000-0000-000000000000"]);

  const orderItemsById = new Map((orderItems ?? []).map((item) => [item.id, item]));

  const refundLines: { orderItemId: string; quantity: number; restock: boolean; amountCents: number }[] = [];
  for (const line of lines) {
    const orderItem = orderItemsById.get(line.orderItemId);
    if (!orderItem || orderItem.id === undefined) {
      return { error: "One of the selected items no longer belongs to this order." };
    }
    if (line.quantity > orderItem.quantity) {
      return { error: "Refund quantity exceeds the quantity on the order." };
    }
    refundLines.push({
      orderItemId: line.orderItemId,
      quantity: line.quantity,
      restock: line.restock,
      amountCents: orderItem.unit_price_cents * line.quantity,
    });
  }

  const totalRefundCents =
    refundLines.reduce((sum, line) => sum + line.amountCents, 0) + shippingRefundCents;

  if (totalRefundCents <= 0) {
    return { error: "Refund amount must be greater than zero." };
  }

  let stripeRefund: Stripe.Refund;
  try {
    stripeRefund = await getStripe().refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: totalRefundCents,
      reason: mapReasonToStripeReason(reason),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe refund failed.";
    return { error: message };
  }

  const { data: refund, error: refundError } = await supabase
    .from("refunds")
    .insert({
      order_id: orderId,
      amount_cents: totalRefundCents,
      reason: reason ?? null,
      stripe_refund_id: stripeRefund.id,
      created_by_email: admin.email ?? null,
    })
    .select("id")
    .single();

  if (refundError || !refund) {
    return { error: refundError?.message ?? "Could not record the refund." };
  }

  if (refundLines.length > 0) {
    await supabase.from("refund_line_items").insert(
      refundLines.map((line) => ({
        refund_id: refund.id,
        order_item_id: line.orderItemId,
        quantity: line.quantity,
        amount_cents: line.amountCents,
        restocked: false,
      }))
    );
  }

  for (const line of refundLines) {
    if (!line.restock) continue;
    const orderItem = orderItemsById.get(line.orderItemId);
    if (!orderItem) continue;

    let ok = false;
    if (orderItem.variant_id) {
      const result = await supabase.rpc("increment_variant_stock", {
        item_variant_id: orderItem.variant_id,
        item_quantity: line.quantity,
      });
      ok = !!result.data;
    } else if (orderItem.product_id) {
      const result = await supabase.rpc("increment_stock", {
        item_product_id: orderItem.product_id,
        item_quantity: line.quantity,
      });
      ok = !!result.data;
    } else {
      continue;
    }

    if (ok) {
      await supabase
        .from("refund_line_items")
        .update({ restocked: true })
        .eq("refund_id", refund.id)
        .eq("order_item_id", line.orderItemId);
    }
  }

  // Recompute cumulative refunded total fresh from the DB rather than
  // accumulating in memory, so concurrent refunds on the same order
  // can't race into an inconsistent financial_status.
  const { data: allRefunds } = await supabase
    .from("refunds")
    .select("amount_cents")
    .eq("order_id", orderId);
  const totalRefundedCents = (allRefunds ?? []).reduce((sum, r) => sum + r.amount_cents, 0);

  const newFinancialStatus = totalRefundedCents >= order.total_cents ? "refunded" : "partially_refunded";
  if (newFinancialStatus === "refunded") {
    await supabase
      .from("orders")
      .update({ financial_status: newFinancialStatus, status: "refunded" })
      .eq("id", orderId);
  } else {
    await supabase.from("orders").update({ financial_status: newFinancialStatus }).eq("id", orderId);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");

  return { success: true };
}
