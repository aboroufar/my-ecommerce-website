import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripeCustomer";
import { calculateShippingCents } from "@/lib/shipping";
import { routing } from "@/i18n/routing";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const locale = routing.locales.includes(body?.locale) ? body.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "checkoutErrors" });

  const requestSchema = z.object({
    locale: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional(),
          quantity: z.number().int().positive().max(99),
        })
      )
      .min(1, t("cartEmpty")),
  });

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("invalidRequest") },
      { status: 400 }
    );
  }
  const { items } = parsed.data;

  const supabase = createAdminClient();

  // If the shopper is logged in, link the order to their account so it
  // shows up in order history. Guest checkout still works fine -- the
  // order is simply created with client_id: null.
  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  // Re-fetch canonical product data server-side. Client-submitted prices
  // are never trusted -- only productId + variantId + quantity come from
  // the client.
  const productIds = items.map((i) => i.productId);
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, stock_qty, status")
    .in("id", productIds);

  if (fetchError) {
    return NextResponse.json(
      { error: t("couldNotLoadProducts") },
      { status: 500 }
    );
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // Re-fetch canonical variant data too, joined back to its option
  // types/values so a human-readable label can be snapshotted onto the
  // order without trusting anything the client sent beyond the id.
  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => !!id);
  const { data: variants, error: variantFetchError } =
    variantIds.length > 0
      ? await supabase
          .from("product_variants")
          .select(
            "id, product_id, price_cents, stock_qty, product_variant_options(product_option_values(label, product_option_types(name)))"
          )
          .in("id", variantIds)
      : { data: [], error: null };

  if (variantFetchError) {
    return NextResponse.json(
      { error: t("couldNotLoadOptions") },
      { status: 500 }
    );
  }

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

  // Validate every line: product exists and is active; if a variant is
  // specified, it must belong to that same product (prevents a tampered
  // client pairing a real variant id with an unrelated product id); stock
  // is checked against the variant when present, otherwise the product.
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || product.status !== "active") {
      return NextResponse.json(
        { error: t("itemUnavailable") },
        { status: 409 }
      );
    }

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.product_id !== item.productId) {
        return NextResponse.json(
          { error: t("itemUnavailable") },
          { status: 409 }
        );
      }
      if (variant.stock_qty < item.quantity) {
        return NextResponse.json(
          { error: t("notEnoughStock", { name: product.name }) },
          { status: 409 }
        );
      }
    } else if (product.stock_qty < item.quantity) {
      return NextResponse.json(
        { error: t("notEnoughStock", { name: product.name }) },
        { status: 409 }
      );
    }
  }

  // Signed-in shoppers must have a complete profile (name, phone, DOB,
  // gender, and a designated billing address) before checking out. Guests
  // have no client row at all, so this only applies when user is set.
  if (user) {
    const { data: profile } = await supabase
      .from("clients")
      .select("name, phone, date_of_birth, gender")
      .eq("id", user.id)
      .single();

    const { data: billingAddress } = await supabase
      .from("addresses")
      .select("id")
      .eq("client_id", user.id)
      .eq("is_billing", true)
      .maybeSingle();

    const profileComplete =
      !!profile?.name &&
      !!profile?.phone &&
      !!profile?.date_of_birth &&
      !!profile?.gender &&
      !!billingAddress;

    if (!profileComplete) {
      return NextResponse.json(
        {
          error: t("incompleteProfile"),
          code: "PROFILE_INCOMPLETE",
        },
        { status: 409 }
      );
    }
  }

  const currency = productMap.get(items[0].productId)!.currency;
  const subtotalCents = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    const unitPrice = variant?.price_cents ?? product.price_cents;
    return sum + unitPrice * item.quantity;
  }, 0);

  // Discount codes are no longer applied here -- the shopper redeems one
  // directly on Stripe's hosted Checkout page (allow_promotion_codes
  // below), and the webhook reconciles orders.total_cents/discount_cents
  // from the actual Stripe session once payment succeeds. The order is
  // created here at the pre-discount total; see markOrderPaid in
  // src/app/api/webhooks/stripe/route.ts for the reconciliation.
  const { data: shippingSettings } = await supabase
    .from("site_settings")
    .select("shipping_flat_rate_cents, free_shipping_threshold_cents")
    .eq("id", true)
    .maybeSingle();

  // Shipping is calculated on the pre-discount subtotal -- a discount
  // code brings the product total down but doesn't itself unlock free
  // shipping, matching standard practice.
  const shippingCents = calculateShippingCents(
    subtotalCents,
    shippingSettings?.shipping_flat_rate_cents ?? 0,
    shippingSettings?.free_shipping_threshold_cents ?? Infinity
  );

  const totalCents = subtotalCents + shippingCents;

  // Create a pending order first so the webhook has something to update
  // once Stripe confirms payment -- avoids trusting anything from the
  // client at confirmation time. total_cents/discount_cents/discount_code
  // here are the pre-discount figures; markOrderPaid in the webhook
  // overwrites them with what Stripe actually charged once payment
  // succeeds, since a promotion code may be redeemed on Stripe's page
  // after this row is created.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      total_cents: totalCents,
      currency,
      client_id: user?.id ?? null,
      discount_code: null,
      discount_cents: 0,
      shipping_cents: shippingCents,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: t("couldNotCreateOrder") },
      { status: 500 }
    );
  }

  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    return {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price_cents: variant?.price_cents ?? product.price_cents,
      variant_id: variant?.id ?? null,
      variant_label: variant ? variantLabel(variant) : null,
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return NextResponse.json(
      { error: t("couldNotCreateOrderItems") },
      { status: 500 }
    );
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  // For a signed-in shopper, reuse (or create) a Stripe Customer and, if
  // they have a default saved address, push it onto that Customer so
  // Stripe's hosted Checkout page pre-fills the shipping fields -- Checkout
  // has no "pass an address into session.create" param, pre-fill only works
  // via customer.shipping. Guest checkout is untouched (customer_email path).
  let stripeCustomerId: string | null = null;
  if (user) {
    stripeCustomerId = await getOrCreateStripeCustomer(supabase, user.id, user.email);

    const { data: defaultAddress } = await supabase
      .from("addresses")
      .select("line1, line2, city, region, postal_code, country")
      .eq("client_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (defaultAddress) {
      await getStripe().customers.update(stripeCustomerId, {
        name: user.user_metadata?.name as string | undefined,
        shipping: {
          name: (user.user_metadata?.name as string | undefined) ?? user.email ?? "",
          address: {
            line1: defaultAddress.line1,
            line2: defaultAddress.line2 ?? undefined,
            city: defaultAddress.city,
            state: defaultAddress.region ?? undefined,
            postal_code: defaultAddress.postal_code,
            country: defaultAddress.country,
          },
        },
      });
    }
  }

  try {
    const stripe = getStripe();

    // Same one-time-object pattern used elsewhere in this route: create a
    // fresh Shipping Rate per checkout attempt rather than syncing a
    // persistent Stripe object, so site_settings stays the source of
    // truth. Skipped entirely when the order qualifies for free shipping
    // -- Stripe's checkout page then shows no shipping line at all.
    let shippingRateId: string | undefined;
    if (shippingCents > 0) {
      const shippingRate = await stripe.shippingRates.create({
        display_name: "Standard shipping",
        type: "fixed_amount",
        fixed_amount: { amount: shippingCents, currency },
      });
      shippingRateId = shippingRate.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => {
        const product = productMap.get(item.productId)!;
        const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
        const name = variant
          ? `${product.name} — ${variantLabel(variant)}`
          : product.name;
        return {
          quantity: item.quantity,
          price_data: {
            currency: product.currency,
            unit_amount: variant?.price_cents ?? product.price_cents,
            product_data: { name },
          },
        };
      }),
      shipping_address_collection: { allowed_countries: ["IT"] },
      payment_method_types: ["card", "klarna", "satispay", "paypal"],
      // Discount codes are now redeemed on Stripe's own hosted page --
      // this surfaces Stripe's built-in "Add promotion code" field,
      // which appears after the shopper enters their shipping address.
      // Requires each discount_codes row to have a matching Stripe
      // Promotion Code (see src/lib/actions/discounts.ts).
      allow_promotion_codes: true,
      ...(shippingRateId
        ? { shipping_options: [{ shipping_rate: shippingRateId }] }
        : {}),
      ...(stripeCustomerId
        ? { customer: stripeCustomerId, customer_update: { shipping: "auto" } }
        : { customer_email: user?.email ?? undefined }),
      success_url: `${origin}/${locale}/checkout/success?order_id=${order.id}`,
      cancel_url: `${origin}/${locale}/cart`,
      metadata: { order_id: order.id },
    });

    if (!session.url) throw new Error("Stripe did not return a session URL");

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Roll back the pending order/items if Stripe session creation fails,
    // so we don't accumulate orphaned pending orders.
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("Stripe session creation failed:", err);
    return NextResponse.json(
      { error: t("couldNotStartCheckout") },
      { status: 500 }
    );
  }
}
