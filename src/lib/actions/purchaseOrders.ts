"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

const PAYMENT_TERMS = [
  "none",
  "cod",
  "receipt",
  "advance",
  "net7",
  "net15",
  "net30",
  "net45",
  "net60",
] as const;

const lineItemSchema = z.object({
  product_id: z.string().uuid().nullable(),
  variant_id: z.string().uuid().nullable(),
  product_name: z.string().min(1),
  variant_label: z.string().nullable(),
  quantity_ordered: z.number().int().positive(),
  unit_cost_cents: z.number().int().min(0),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid().nullable(),
  reference_number: z.string().optional().default(""),
  note_to_supplier: z.string().max(5000, "Note must be 5000 characters or fewer").optional().default(""),
  payment_terms: z.enum(PAYMENT_TERMS),
  currency: z.string().min(1),
  itemsJson: z.string().min(1, "Add at least one product"),
});

function parseLineItems(
  itemsJson: string
):
  | { ok: false; error: string }
  | { ok: true; items: z.infer<typeof lineItemSchema>[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(itemsJson);
  } catch {
    return { ok: false, error: "Could not read the product list -- try re-adding your items." };
  }
  const parsed = z.array(lineItemSchema).min(1, "Add at least one product").safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  return { ok: true, items: parsed.data };
}

/**
 * Line items travel as one JSON blob (itemsJson), same pattern as
 * discounts' configJson -- the form has many dynamically-added rows, not
 * a fixed set of named FormData fields.
 */
export async function createPurchaseOrder(formData: FormData) {
  await requireAdmin();

  const parsed = purchaseOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/purchase-orders/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const itemsResult = parseLineItems(parsed.data.itemsJson);
  if (!itemsResult.ok) {
    redirect(`/admin/purchase-orders/new?error=${encodeURIComponent(itemsResult.error)}`);
  }

  const { supplier_id, reference_number, note_to_supplier, payment_terms, currency } = parsed.data;

  const supabase = createAdminClient();
  const { data: po, error } = await supabase
    .from("purchase_orders")
    .insert({
      supplier_id,
      reference_number: reference_number || null,
      note_to_supplier: note_to_supplier || null,
      payment_terms,
      currency,
    })
    .select("id")
    .single();

  if (error || !po) {
    redirect(
      `/admin/purchase-orders/new?error=${encodeURIComponent(error?.message ?? "Could not create purchase order.")}`
    );
  }

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(
    itemsResult.items.map((item) => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      quantity_ordered: item.quantity_ordered,
      unit_cost_cents: item.unit_cost_cents,
    }))
  );

  if (itemsError) {
    // Roll back the PO header -- a purchase order with no line items is
    // worse than no purchase order at all, same reasoning as the
    // checkout route's Stripe-failure rollback.
    await supabase.from("purchase_orders").delete().eq("id", po.id);
    redirect(`/admin/purchase-orders/new?error=${encodeURIComponent(itemsError.message)}`);
  }

  revalidatePath("/admin/purchase-orders");
  redirect(`/admin/purchase-orders/${po.id}`);
}

export async function updatePurchaseOrderDetails(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = purchaseOrderSchema
    .omit({ itemsJson: true })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/purchase-orders/${id}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { supplier_id, reference_number, note_to_supplier, payment_terms, currency } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({
      supplier_id,
      reference_number: reference_number || null,
      note_to_supplier: note_to_supplier || null,
      payment_terms,
      currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/purchase-orders/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${id}`);
  redirect(`/admin/purchase-orders/${id}`);
}

const statusUpdateSchema = z.object({
  status: z.enum(["draft", "ordered", "received", "cancelled"]),
});

export async function updatePurchaseOrderStatus(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = statusUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/purchase-orders/${id}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/admin/purchase-orders/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${id}`);
  redirect(`/admin/purchase-orders/${id}`);
}

const receiveItemsSchema = z.object({
  itemsJson: z.string().min(1),
});

const receivedQuantitySchema = z.array(
  z.object({
    id: z.string().uuid(),
    quantity_received: z.number().int().min(0),
  })
);

/**
 * Updates each line item's quantity_received independently -- deliberately
 * NOT touching products.stock_qty/product_variants.stock_qty. Recording
 * what arrived is record-keeping only in this pass; incrementing real
 * stock from a received PO is a separate, clearly-scoped follow-up.
 */
export async function updateReceivedQuantities(purchaseOrderId: string, formData: FormData) {
  await requireAdmin();

  const parsed = receiveItemsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/purchase-orders/${purchaseOrderId}?error=${encodeURIComponent("Could not read received quantities.")}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(parsed.data.itemsJson);
  } catch {
    redirect(`/admin/purchase-orders/${purchaseOrderId}?error=${encodeURIComponent("Could not read received quantities.")}`);
  }
  const items = receivedQuantitySchema.safeParse(raw);
  if (!items.success) {
    redirect(`/admin/purchase-orders/${purchaseOrderId}?error=${encodeURIComponent(items.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const results = await Promise.all(
    items.data.map((item) =>
      supabase
        .from("purchase_order_items")
        .update({ quantity_received: item.quantity_received })
        .eq("id", item.id)
        .eq("purchase_order_id", purchaseOrderId)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    redirect(`/admin/purchase-orders/${purchaseOrderId}?error=${encodeURIComponent(failed.error.message)}`);
  }

  revalidatePath(`/admin/purchase-orders/${purchaseOrderId}`);
  redirect(`/admin/purchase-orders/${purchaseOrderId}`);
}

export async function deletePurchaseOrder(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);

  if (error) {
    redirect(`/admin/purchase-orders?error=${encodeURIComponent("Could not delete: " + error.message)}`);
  }

  revalidatePath("/admin/purchase-orders");
  redirect("/admin/purchase-orders");
}
