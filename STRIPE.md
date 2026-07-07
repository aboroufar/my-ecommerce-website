# Stripe setup

## 1. Get your API keys
Sign up at stripe.com, then in the dashboard (make sure **Test mode** is on
while developing): **Developers → API keys** → copy the **Secret key**
(`sk_test_...`) into `STRIPE_SECRET_KEY` in `.env.local`.

## 2. Forward webhooks while developing locally
Stripe needs to reach your webhook endpoint, which isn't possible for
`localhost` directly. Use the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe   # or see stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This prints a webhook signing secret (`whsec_...`) — put that in
`STRIPE_WEBHOOK_SECRET` in `.env.local`. Keep `stripe listen` running in a
terminal while you test checkout locally.

## 3. Test a full checkout
1. `npm run dev`, add an item to your cart, click **Checkout**.
2. On the Stripe-hosted checkout page, use a [test card](https://docs.stripe.com/testing#cards)
   — e.g. `4242 4242 4242 4242`, any future expiry, any CVC.
3. You should land on `/checkout/success`, and the `stripe listen` terminal
   should show a `checkout.session.completed` event being forwarded.
4. Check the Supabase `orders` table — the order's `status` should flip from
   `pending` to `paid`, and the product's `stock_qty` should decrement.

## 4. Set up the production webhook (once deployed)
In the Stripe dashboard: **Developers → Webhooks → Add endpoint**.
- Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- Events to send: `checkout.session.completed`, `checkout.session.expired`

Copy the signing secret shown there into your **Vercel** environment
variables as `STRIPE_WEBHOOK_SECRET` (this will be a different value than
your local CLI one). Add `STRIPE_SECRET_KEY` there too.

## 5. Go live
When ready for real payments: toggle off **Test mode** in the Stripe
dashboard, generate live-mode API keys, and swap `STRIPE_SECRET_KEY` /
`STRIPE_WEBHOOK_SECRET` in Vercel to the live versions. Nothing in the code
needs to change — Stripe test/live keys are interchangeable at the config
level.

## Notes on the current implementation
- Prices are always re-fetched from Supabase server-side before creating a
  Checkout Session (`src/app/api/checkout/route.ts`) — the client only ever
  sends `productId` + `quantity`, never a price, so tampering with prices in
  the browser has no effect.
- An `orders` row is created with `status: "pending"` *before* redirecting to
  Stripe, so the webhook has something to update rather than trusting
  anything from the redirect itself.
- Stock is decremented in the webhook handler with a simple sequential
  read-then-write per line item. This is fine at low order volume; at higher
  concurrency you'd want a single atomic Postgres function
  (`UPDATE products SET stock_qty = stock_qty - quantity WHERE stock_qty >= quantity`)
  to avoid a race condition between simultaneous orders for the same item.
