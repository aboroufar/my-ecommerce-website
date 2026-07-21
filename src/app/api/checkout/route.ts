import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripeCustomer";
import { calculateShippingCents } from "@/lib/shipping";
import { routing } from "@/i18n/routing";
import { getClientFacts } from "@/lib/segments";
import {
  evaluateDiscountEligibility,
  discountCategory,
  type DiscountConfig,
  type CartLine,
} from "@/lib/discounts";

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
    discountCode: z.string().optional(),
  });

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("invalidRequest") },
      { status: 400 }
    );
  }
  const { items, discountCode } = parsed.data;

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

  // Discounts are now evaluated and applied entirely server-side, before
  // the Stripe Checkout Session is created -- never redeemed on Stripe's
  // own hosted page. This lets eligibility rules (minimum purchase,
  // specific products/collections, specific segments) actually be
  // enforced, which a Stripe Promotion Code alone can't encode.
  const { data: categoryLinks } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", productIds);
  const categoriesByProduct = new Map<string, string[]>();
  for (const link of categoryLinks ?? []) {
    const existing = categoriesByProduct.get(link.product_id) ?? [];
    existing.push(link.category_id);
    categoriesByProduct.set(link.product_id, existing);
  }

  const cartLines: CartLine[] = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    return {
      productId: item.productId,
      categoryIds: categoriesByProduct.get(item.productId) ?? [],
      quantity: item.quantity,
      unitPriceCents: variant?.price_cents ?? product.price_cents,
    };
  });

  const now = new Date().toISOString();
  const { data: activeDiscounts } = await supabase
    .from("discount_codes")
    .select("id, code, discount_type, config")
    .eq("active", true)
    .lte("starts_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  const clientFacts = user
    ? (await getClientFacts(supabase, [user.id]))[0] ?? null
    : null;

  // Usage counts, keyed by discount code, needed to enforce
  // usageLimits.onePerCustomer -- derived from past orders rather than a
  // dedicated counter column, consistent with this codebase's
  // "aggregate in app code" preference elsewhere.
  const candidateCodes = (activeDiscounts ?? []).map((d) => d.code);
  const { data: pastRedemptions } =
    candidateCodes.length > 0
      ? await supabase
          .from("orders")
          .select("discount_code, client_id")
          .in("discount_code", candidateCodes)
          .in("status", ["paid", "fulfilled", "refunded"])
      : { data: [] as { discount_code: string | null; client_id: string | null }[] };

  function usageFor(code: string) {
    const matching = (pastRedemptions ?? []).filter((o) => o.discount_code === code);
    return { clientUses: user ? matching.filter((o) => o.client_id === user.id).length : 0 };
  }

  const eligibilityContext = {
    clientId: user?.id ?? null,
    clientFacts,
    cartLines,
    subtotalCents,
  };

  // Every eligible discount (automatic ones, plus the submitted code if
  // it's eligible) becomes a candidate for stacking -- not just a single
  // "best" pick. If the submitted code isn't found or isn't eligible,
  // fail the whole checkout rather than silently proceeding without it,
  // so a shopper never gets charged full price after entering a code
  // they believed was applied.
  const candidates: { code: string; discountType: DiscountConfig["discount_type"]; config: DiscountConfig; result: Extract<ReturnType<typeof evaluateDiscountEligibility>, { eligible: true }> }[] = [];

  for (const d of activeDiscounts ?? []) {
    const config = d.config as unknown as DiscountConfig;
    if (config.method !== "automatic") continue;
    const result = evaluateDiscountEligibility(config, { ...eligibilityContext, usage: usageFor(d.code) });
    if (result.eligible) {
      candidates.push({ code: d.code, discountType: d.discount_type as DiscountConfig["discount_type"], config, result });
    }
  }

  if (discountCode) {
    const matchingDiscount = (activeDiscounts ?? []).find(
      (d) =>
        (d.config as unknown as DiscountConfig).method === "code" &&
        d.code.toUpperCase() === discountCode.trim().toUpperCase()
    );
    if (!matchingDiscount) {
      return NextResponse.json(
        { error: t("discountNotApplicable"), code: "DISCOUNT_NOT_APPLICABLE" },
        { status: 409 }
      );
    }
    const config = matchingDiscount.config as unknown as DiscountConfig;
    const result = evaluateDiscountEligibility(config, {
      ...eligibilityContext,
      usage: usageFor(matchingDiscount.code),
    });
    if (!result.eligible) {
      return NextResponse.json(
        { error: t("discountNotApplicable"), code: "DISCOUNT_NOT_APPLICABLE" },
        { status: 409 }
      );
    }
    candidates.push({
      code: matchingDiscount.code,
      discountType: matchingDiscount.discount_type as DiscountConfig["discount_type"],
      config,
      result,
    });
  }

  // Greedily build the combined set: take candidates best-value-first,
  // only adding one if it and every already-selected discount mutually
  // allow combining across each other's category (product/order/
  // shipping). This means each discount's own combinesWith* flags are
  // checked both ways -- A must allow combining with B's category, and
  // B must allow combining with A's category.
  function candidateCents(c: (typeof candidates)[number]): number {
    return "discountCents" in c.result ? c.result.discountCents : 0;
  }
  candidates.sort((a, b) => candidateCents(b) - candidateCents(a));

  const selected: typeof candidates = [];
  for (const candidate of candidates) {
    const candidateCategory = discountCategory(candidate.discountType);
    const combinesWithCategory = (combos: typeof candidate.config.combinations, category: ReturnType<typeof discountCategory>) =>
      category === "product" ? combos.combinesWithProduct : category === "order" ? combos.combinesWithOrder : combos.combinesWithShipping;

    const compatibleWithAllSelected = selected.every((s) => {
      const selectedCategory = discountCategory(s.discountType);
      return (
        combinesWithCategory(candidate.config.combinations, selectedCategory) &&
        combinesWithCategory(s.config.combinations, candidateCategory)
      );
    });

    if (selected.length === 0 || compatibleWithAllSelected) {
      selected.push(candidate);
    }
  }

  let discountCents = 0;
  let freeShipping = false;
  let appliedDiscountCode: string | null = null;

  for (const s of selected) {
    if ("discountCents" in s.result) discountCents += s.result.discountCents;
    if ("freeShipping" in s.result) freeShipping = true;
    if (s.config.method === "code") appliedDiscountCode = s.code;
  }

  const { data: shippingSettings } = await supabase
    .from("site_settings")
    .select("shipping_flat_rate_cents, free_shipping_threshold_cents")
    .eq("id", true)
    .maybeSingle();

  // Shipping is calculated on the pre-discount subtotal -- an amount/
  // percent discount brings the product total down but doesn't itself
  // unlock free shipping, matching standard practice. A free_shipping
  // discount overrides this to 0 regardless.
  const shippingCents = freeShipping
    ? 0
    : calculateShippingCents(
        subtotalCents,
        shippingSettings?.shipping_flat_rate_cents ?? 0,
        shippingSettings?.free_shipping_threshold_cents ?? Infinity
      );

  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  // The discount is now known before the order is created (no longer a
  // 0/null placeholder later overwritten by the webhook), since it's
  // computed here rather than redeemed on Stripe's own page.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      total_cents: totalCents,
      currency,
      client_id: user?.id ?? null,
      discount_code: appliedDiscountCode,
      discount_cents: discountCents,
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

    // A one-time Coupon minted fresh per checkout, carrying the exact
    // amount_off this app computed -- never percent_off, since a
    // product/collection-scoped or buy-x-get-y discount doesn't apply
    // uniformly to the whole cart, so only a precomputed absolute cents
    // figure is trustworthy at the Stripe session level.
    const discountCoupon =
      discountCents > 0
        ? await stripe.coupons.create({ duration: "once", amount_off: discountCents, currency })
        : null;

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
      // Discounts are computed by this app, never redeemed by the
      // shopper on Stripe's page -- Stripe's own promo-code field is
      // disabled so the two paths can never disagree about eligibility.
      allow_promotion_codes: false,
      ...(discountCoupon ? { discounts: [{ coupon: discountCoupon.id }] } : {}),
      ...(shippingRateId
        ? { shipping_options: [{ shipping_rate: shippingRateId }] }
        : {}),
      ...(stripeCustomerId
        ? { customer: stripeCustomerId, customer_update: { shipping: "auto" } }
        : { customer_email: user?.email ?? undefined }),
      success_url: `${origin}/${locale}/checkout/success?order_id=${order.id}`,
      cancel_url: `${origin}/${locale}/cart`,
      metadata: { order_id: order.id, discount_code: appliedDiscountCode ?? "" },
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
