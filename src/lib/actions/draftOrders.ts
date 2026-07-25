"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { promoteDraftOrder } from "@/lib/orderStock";

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

const draftLineSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
});

const createDraftOrderSchema = z
  .object({
    client_id: z.string().uuid().optional().or(z.literal("")),
    guest_name: z.string().optional().default(""),
    guest_email: z.string().optional().default(""),
    lines_json: z.string().min(1, "Add at least one item"),
    // Admin enters a whole-currency amount (e.g. "5.00"); converted to
    // cents here, same as every other price the admin types in this app.
    shipping_amount: z.coerce.number().min(0).default(0),
  })
  .transform((data, ctx) => {
    let lines: z.infer<typeof draftLineSchema>[];
    try {
      lines = z.array(draftLineSchema).parse(JSON.parse(data.lines_json));
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid line items." });
      return z.NEVER;
    }
    if (lines.length === 0) {
      ctx.addIssue({ code: "custom", message: "Add at least one item." });
      return z.NEVER;
    }
    const clientId = data.client_id || undefined;
    if (!clientId && (!data.guest_name || !data.guest_email)) {
      ctx.addIssue({
        code: "custom",
        message: "Choose a client or enter a guest name and email.",
      });
      return z.NEVER;
    }
    return {
      ...data,
      client_id: clientId,
      lines,
      shipping_cents: Math.round(data.shipping_amount * 100),
    };
  });

/**
 * Creates a draft order (an admin-built order awaiting payment) --
 * mirrors checkout/route.ts's own principle exactly: only
 * productId/variantId/quantity come from the client, every price is
 * re-fetched server-side from products/product_variants, never trusted
 * from the submitted lines_json.
 */
export async function createDraftOrder(formData: FormData) {
  await requireAdmin();

  const parsed = createDraftOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/orders/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const { client_id, guest_name, guest_email, lines, shipping_cents } = parsed.data;

  const supabase = createAdminClient();

  const productIds = lines.map((l) => l.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents")
    .in("id", productIds);
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const variantIds = lines.map((l) => l.variantId).filter((id): id is string => !!id);
  const { data: variants } =
    variantIds.length > 0
      ? await supabase
          .from("product_variants")
          .select(
            "id, product_id, price_cents, product_variant_options(product_option_values(label, product_option_types(name)))"
          )
          .in("id", variantIds)
      : { data: [] };
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  function variantLabel(variant: NonNullable<typeof variants>[number]): string {
    return variant.product_variant_options
      .map((o) => {
        const value = o.product_option_values;
        return value ? `${value.product_option_types?.name}: ${value.label}` : null;
      })
      .filter(Boolean)
      .join(", ");
  }

  const resolvedLines: {
    productId: string;
    productName: string;
    variantId: string | null;
    variantLabel: string | null;
    quantity: number;
    unitPriceCents: number;
  }[] = [];

  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) {
      redirect(`/admin/orders/new?error=${encodeURIComponent("One of the selected items no longer exists.")}`);
    }

    let unitPriceCents = product!.price_cents;
    let label: string | null = null;
    if (line.variantId) {
      const variant = variantMap.get(line.variantId);
      if (!variant || variant.product_id !== line.productId) {
        redirect(`/admin/orders/new?error=${encodeURIComponent("One of the selected items no longer exists.")}`);
      }
      unitPriceCents = variant!.price_cents;
      label = variantLabel(variant!);
    }

    resolvedLines.push({
      productId: line.productId,
      productName: product!.name,
      variantId: line.variantId ?? null,
      variantLabel: label,
      quantity: line.quantity,
      unitPriceCents,
    });
  }

  const subtotalCents = resolvedLines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const totalCents = subtotalCents + shipping_cents;

  const { data: draftOrder, error: draftOrderError } = await supabase
    .from("draft_orders")
    .insert({
      client_id: client_id ?? null,
      guest_name: client_id ? null : guest_name,
      guest_email: client_id ? null : guest_email,
      status: "open",
      subtotal_cents: subtotalCents,
      shipping_cents,
      total_cents: totalCents,
    })
    .select("id")
    .single();

  if (draftOrderError || !draftOrder) {
    redirect(`/admin/orders/new?error=${encodeURIComponent(draftOrderError?.message ?? "Could not create the draft order.")}`);
  }

  await supabase.from("draft_order_items").insert(
    resolvedLines.map((line) => ({
      draft_order_id: draftOrder!.id,
      product_id: line.productId,
      product_name: line.productName,
      quantity: line.quantity,
      unit_price_cents: line.unitPriceCents,
      variant_id: line.variantId,
      variant_label: line.variantLabel,
    }))
  );

  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/drafts");
  redirect(`/admin/orders/drafts/${draftOrder!.id}`);
}

/**
 * Marks a draft order paid in cash/comp (no Stripe involved) and
 * promotes it to a real order via the same promoteDraftOrder helper the
 * webhook uses for a paid Payment Link -- one shared code path, not a
 * duplicated implementation.
 */
export async function markDraftOrderPaid(draftOrderId: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: draftOrder } = await supabase
    .from("draft_orders")
    .select("status, guest_email")
    .eq("id", draftOrderId)
    .single();

  if (!draftOrder) {
    redirect(`/admin/orders/drafts?error=${encodeURIComponent("Draft order not found.")}`);
  }
  if (draftOrder!.status === "completed") {
    redirect(`/admin/orders/drafts/${draftOrderId}`);
  }

  const result = await promoteDraftOrder(supabase, draftOrderId, {
    stripePaymentIntentId: null,
    customerEmail: draftOrder!.guest_email,
  });

  if ("error" in result) {
    redirect(`/admin/orders/drafts/${draftOrderId}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/drafts");
  revalidatePath(`/admin/orders/drafts/${draftOrderId}`);
  revalidatePath(`/admin/orders/${result.orderId}`);
  redirect(`/admin/orders/${result.orderId}`);
}

/**
 * Creates a Stripe Payment Link for a draft order so the customer can
 * pay whenever they like -- a Payment Link rather than a second
 * Checkout Session because Sessions expire and are single-use, wrong
 * for "admin sends a link, customer pays in three days." Mints one-time
 * Stripe Prices per line item (never reusing/trusting anything but the
 * draft's own already-canonical unit_price_cents) plus a shipping line
 * if applicable, and tags the link with metadata.draft_order_id so the
 * webhook can resolve it back to this draft when paid.
 */
export async function sendDraftOrderInvoice(draftOrderId: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: draftOrder } = await supabase
    .from("draft_orders")
    .select("id, status, currency, shipping_cents")
    .eq("id", draftOrderId)
    .single();

  if (!draftOrder) {
    redirect(`/admin/orders/drafts?error=${encodeURIComponent("Draft order not found.")}`);
  }
  if (draftOrder!.status === "completed") {
    redirect(`/admin/orders/drafts/${draftOrderId}`);
  }

  const { data: draftItems } = await supabase
    .from("draft_order_items")
    .select("product_name, variant_label, quantity, unit_price_cents")
    .eq("draft_order_id", draftOrderId);

  // redirect() throws a Next.js control-flow signal, not a real error --
  // it must never be called from inside this try block. Only the Stripe
  // calls go here; every redirect happens after, based on a result
  // variable, matching the discipline in src/lib/actions/orders.ts.
  let paymentLinkId: string;
  let paymentLinkUrl: string;
  try {
    const stripe = getStripe();
    const lineItems = await Promise.all(
      (draftItems ?? []).map(async (item) => {
        const price = await stripe.prices.create({
          currency: draftOrder!.currency,
          unit_amount: item.unit_price_cents,
          product_data: {
            name: item.variant_label ? `${item.product_name} — ${item.variant_label}` : item.product_name,
          },
        });
        return { price: price.id, quantity: item.quantity };
      })
    );

    if (draftOrder!.shipping_cents > 0) {
      const shippingPrice = await stripe.prices.create({
        currency: draftOrder!.currency,
        unit_amount: draftOrder!.shipping_cents,
        product_data: { name: "Shipping" },
      });
      lineItems.push({ price: shippingPrice.id, quantity: 1 });
    }

    const siteUrl = process.env.SITE_URL;
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      metadata: { draft_order_id: draftOrderId },
      after_completion: siteUrl
        ? { type: "redirect", redirect: { url: `${siteUrl}/checkout/success` } }
        : undefined,
    });
    paymentLinkId = paymentLink.id;
    paymentLinkUrl = paymentLink.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create the payment link.";
    redirect(`/admin/orders/drafts/${draftOrderId}?error=${encodeURIComponent(message)}`);
  }

  await supabase
    .from("draft_orders")
    .update({
      stripe_payment_link_id: paymentLinkId!,
      stripe_payment_link_url: paymentLinkUrl!,
      invoice_sent_at: new Date().toISOString(),
      status: "invoice_sent",
    })
    .eq("id", draftOrderId);

  revalidatePath("/admin/orders/drafts");
  revalidatePath(`/admin/orders/drafts/${draftOrderId}`);
  redirect(`/admin/orders/drafts/${draftOrderId}`);
}
