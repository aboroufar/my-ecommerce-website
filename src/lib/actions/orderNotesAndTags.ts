"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

/**
 * Notes, staff comments, and tags for order records -- direct copies of
 * the client-detail-page precedent (src/lib/actions/clients.ts's
 * addClientNote, src/lib/actions/clientTags.ts), retargeted at orders.
 * Kept in their own file rather than folded into orders.ts since these
 * are a distinct feature area (Timeline/Notes/Tags sidebar) from order
 * fulfillment/cancellation actions.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

const orderNoteFieldSchema = z.object({
  notes: z.string(),
});

/**
 * Sets the order's single freeform "Notes" field (Shopify's own Notes
 * card -- one field, not a list, distinct from the Timeline's running
 * order_notes comment log below). An empty string clears it back to the
 * "No notes" placeholder state.
 */
export async function setOrderNote(
  orderId: string,
  notes: string
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();

  const parsed = orderNoteFieldSchema.safeParse({ notes });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ notes: parsed.data.notes || null })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

const orderCommentSchema = z.object({
  body: z.string().min(1, "Comment can't be empty"),
});

/**
 * Adds a staff-only comment to an order's Timeline. Returns a result
 * instead of redirecting, same reasoning as addClientNote -- the order
 * detail page is a single-page dashboard, so the caller just clears its
 * own textarea on success rather than triggering a full-page round trip.
 */
export async function addOrderComment(
  orderId: string,
  body: string
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();

  const parsed = orderCommentSchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("order_notes")
    .insert({ order_id: orderId, body: parsed.data.body });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

/**
 * Organizational tags for orders, kept in their own
 * order_tags/order_tag_links tables so they don't share a pool with
 * client tags, product tags, discount labels, or blog tags -- same
 * per-feature-pool reasoning as clientTags.ts.
 */
export async function createOrderTagInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  await requireAdmin();

  const parsed = tagSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_tags")
    .insert({ name: parsed.data.name, slug: slugify(parsed.data.name) })
    .select("id, name")
    .single();

  if (error || !data) {
    return {
      error: error?.code === "23505" ? "That tag already exists." : (error?.message ?? "Could not create tag."),
    };
  }

  revalidatePath("/admin/orders");
  return data;
}

/**
 * Replaces an order's full tag assignment set with the given list --
 * same "delete all, reinsert" approach as setClientTags/setProductTags.
 */
export async function setOrderTags(orderId: string, tagIds: string[]) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("order_tag_links").delete().eq("order_id", orderId);

  if (tagIds.length > 0) {
    await supabase.from("order_tag_links").insert(tagIds.map((tag_id) => ({ order_id: orderId, tag_id })));
  }

  revalidatePath(`/admin/orders/${orderId}`);
}
