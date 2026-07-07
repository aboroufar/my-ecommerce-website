import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const requestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1, "Cart is empty"),
});

export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
  const { items } = parsed.data;

  const supabase = createAdminClient();

  // If the shopper is logged in, link the order to their account so it
  // shows up in order history. Guest checkout still works fine -- the
  // order is simply created with customer_id: null.
  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  // Re-fetch canonical product data server-side. Client-submitted prices
  // are never trusted -- only productId + quantity come from the client.
  const productIds = items.map((i) => i.productId);
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, stock_qty, status")
    .in("id", productIds);

  if (fetchError) {
    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 }
    );
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // Validate every line: product exists, is active, and has enough stock.
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || product.status !== "active") {
      return NextResponse.json(
        { error: "One of the items in your cart is no longer available." },
        { status: 409 }
      );
    }
    if (product.stock_qty < item.quantity) {
      return NextResponse.json(
        { error: `Not enough stock for "${product.name}".` },
        { status: 409 }
      );
    }
  }

  const currency = productMap.get(items[0].productId)!.currency;
  const totalCents = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price_cents * item.quantity;
  }, 0);

  // Create a pending order first so the webhook has something to update
  // once Stripe confirms payment -- avoids trusting anything from the
  // client at confirmation time.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      total_cents: totalCents,
      currency,
      customer_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Could not create order." },
      { status: 500 }
    );
  }

  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price_cents: product.price_cents,
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return NextResponse.json(
      { error: "Could not create order items." },
      { status: 500 }
    );
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          quantity: item.quantity,
          price_data: {
            currency: product.currency,
            unit_amount: product.price_cents,
            product_data: { name: product.name },
          },
        };
      }),
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "IT"] },
      customer_email: user?.email ?? undefined,
      success_url: `${origin}/checkout/success?order_id=${order.id}`,
      cancel_url: `${origin}/cart`,
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
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
