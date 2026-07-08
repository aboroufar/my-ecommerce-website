"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const statusSchema = z.object({
  status: z.enum(["pending", "paid", "fulfilled", "cancelled", "refunded"]),
});

/**
 * Every action here re-checks admin auth itself rather than relying solely
 * on the layout guard -- server actions are callable directly over the
 * network, so the layout's redirect alone isn't enough protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function updateOrderStatus(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  // Manual status changes here are separate from the automatic
  // pending -> paid transition the Stripe webhook makes -- this is for
  // fulfillment/refund bookkeeping after payment, not payment confirmation
  // itself. Stock is never touched here; decrement_stock only runs from
  // the webhook, once, when a payment is actually confirmed.
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
  redirect(`/admin/orders/${id}`);
}

export async function bulkUpdateOrderStatus(formData: FormData) {
  await requireAdmin();

  const ids = formData.getAll("order_ids") as string[];
  const parsedStatus = z
    .enum(["pending", "paid", "fulfilled", "cancelled", "refunded"])
    .safeParse(formData.get("bulk_status"));

  if (ids.length === 0 || !parsedStatus.success) {
    redirect(
      `/admin/orders?error=${encodeURIComponent("Select at least one order and a status.")}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsedStatus.data })
    .in("id", ids);

  if (error) {
    redirect(`/admin/orders?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  redirect("/admin/orders");
}
