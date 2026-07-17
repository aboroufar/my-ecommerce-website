"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { getShippingRates, purchaseShippingLabel } from "@/lib/shippo";

interface StripeShippingAddress {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

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

const rateRequestSchema = z.object({
  weight_grams: z.coerce.number().positive("Weight must be greater than 0"),
  length_cm: z.coerce.number().positive("Length must be greater than 0"),
  width_cm: z.coerce.number().positive("Width must be greater than 0"),
  height_cm: z.coerce.number().positive("Height must be greater than 0"),
});

/**
 * Fetches live carrier rates for an order's real shipping address (captured
 * by Stripe at checkout) against the shop's ship-from address, using the
 * parcel weight/dimensions the admin enters here -- product weight_text is
 * freeform text, not structured data a shipping API can use, so this is
 * asked for per-shipment rather than derived from product data.
 */
export async function fetchShippingRates(orderId: string, formData: FormData) {
  await requireAdmin();

  const parsed = rateRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("shipping_address")
    .eq("id", orderId)
    .single();

  const shipping = order?.shipping_address as StripeShippingAddress | null;
  if (!shipping?.address?.line1) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent("This order has no shipping address.")}`
    );
  }

  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "ship_from_name, ship_from_line1, ship_from_line2, ship_from_city, ship_from_region, ship_from_postal_code, ship_from_country, ship_from_phone, ship_from_email"
    )
    .eq("id", true)
    .maybeSingle();

  if (!settings?.ship_from_line1 || !settings?.ship_from_country) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(
        "Set a shipping origin address in Admin → Settings before buying a label."
      )}`
    );
  }

  // redirect() works by throwing a special Next.js control-flow signal, not
  // a real error -- it must never be called from inside this try block, or
  // the catch below would treat that throw as a real failure and swallow
  // it into a second (broken) redirect. Only the actual Shippo API call
  // goes in the try; every redirect happens after it, based on a result
  // variable, so no redirect() ever passes through this catch.
  let rates: Awaited<ReturnType<typeof getShippingRates>>;
  try {
    rates = await getShippingRates({
      fromAddress: {
        name: settings.ship_from_name || "Storefront",
        street1: settings.ship_from_line1,
        street2: settings.ship_from_line2 ?? undefined,
        city: settings.ship_from_city ?? "",
        state: settings.ship_from_region ?? undefined,
        zip: settings.ship_from_postal_code ?? "",
        country: settings.ship_from_country,
        phone: settings.ship_from_phone ?? undefined,
        email: settings.ship_from_email ?? undefined,
      },
      toAddress: {
        name: shipping!.name ?? "",
        street1: shipping!.address!.line1 ?? "",
        street2: shipping!.address!.line2 ?? undefined,
        city: shipping!.address!.city ?? "",
        state: shipping!.address!.state ?? undefined,
        zip: shipping!.address!.postal_code ?? "",
        country: shipping!.address!.country ?? "",
      },
      parcel: {
        weightGrams: parsed.data.weight_grams,
        lengthCm: parsed.data.length_cm,
        widthCm: parsed.data.width_cm,
        heightCm: parsed.data.height_cm,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch shipping rates.";
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(message)}`);
  }

  if (rates.length === 0) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent("No carrier rates were returned for this address.")}`
    );
  }

  await supabase
    .from("orders")
    .update({ pending_rates: JSON.parse(JSON.stringify(rates)) })
    .eq("id", orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}

const buyLabelSchema = z.object({
  rate_id: z.string().min(1, "Choose a rate"),
});

/**
 * Purchases a label for a previously-fetched rate and writes tracking
 * details onto the order. Buying a label is a real, non-refundable charge
 * to the store's Shippo balance -- unlike updateOrderStatus, this is not
 * something to retry blindly on failure. The rate's provider name is
 * looked up from the order's own pending_rates (already fetched and
 * trusted server-side) rather than trusting a second form field, so the
 * form only needs to submit the chosen rate id.
 */
export async function buyShippingLabel(orderId: string, formData: FormData) {
  await requireAdmin();

  const parsed = buyLabelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("pending_rates")
    .eq("id", orderId)
    .single();

  const pendingRates = (order?.pending_rates ?? []) as { rateId: string; provider: string }[];
  const chosenRate = pendingRates.find((r) => r.rateId === parsed.data.rate_id);
  if (!chosenRate) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent("That rate is no longer available -- fetch rates again.")}`
    );
  }

  // Same rule as fetchShippingRates: redirect() throws a Next.js
  // control-flow signal, not a real error, so it must never happen inside
  // this try -- only the Shippo API call does, and every redirect happens
  // after, based on a result variable.
  let label: Awaited<ReturnType<typeof purchaseShippingLabel>>;
  try {
    label = await purchaseShippingLabel(parsed.data.rate_id, chosenRate!.provider);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not purchase the shipping label.";
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase
    .from("orders")
    .update({
      carrier: label.carrier,
      tracking_number: label.trackingNumber,
      tracking_url: label.trackingUrl,
      label_url: label.labelUrl,
      shippo_transaction_id: label.transactionId,
      pending_rates: null,
    })
    .eq("id", orderId);

  if (error) {
    redirect(`/admin/orders/${orderId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  redirect(`/admin/orders/${orderId}`);
}

/**
 * Discards a previously-fetched rate list without buying anything, so the
 * admin can re-enter weight/dimensions and fetch fresh rates.
 */
export async function clearPendingRates(orderId: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("orders").update({ pending_rates: null }).eq("id", orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}
