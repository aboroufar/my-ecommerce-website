# Shipping setup (Shippo)

## 1. Get your API key
Sign up at [goshippo.com](https://goshippo.com), then in the dashboard:
**Settings → API → Access tokens** → copy the **Test token**
(`shippo_test_...`) into `SHIPPO_API_KEY` in `.env.local`. Swap for the
**Live token** (`shippo_live_...`) once you're ready to buy real labels.

## 2. Set your shipping origin address
In `/admin/settings`, fill in the **Shipping origin** section (sender name,
address, city, region, postal code, 2-letter country code). This is the
address every label ships from — Shippo needs a real origin to fetch rates.

## 3. Buy a label for a paid order
On `/admin/orders/[id]`, once an order has a real shipping address (captured
automatically by Stripe at checkout), a **Shipping label** section appears:

1. Enter the parcel's weight (grams) and dimensions (cm) and click
   **Get rates**. This calls Shippo with the order's shipping address and
   your ship-from address, and shows the carrier options it returns
   (USPS, UPS, DHL, Poste Italiane, etc., depending on which carriers your
   Shippo account has enabled).
2. Pick a rate and click **Buy label**. This is a real charge to your
   Shippo account balance (test-mode tokens generate dummy labels for free).
3. Once purchased, the order shows the carrier, tracking number, a link to
   track the shipment, and a link to the label PDF. The customer sees the
   same tracking info on their own order page.

Use **Start over** to discard a fetched rate list and re-enter weight if
you made a mistake — nothing is charged until you click **Buy label**.

## Notes on the current implementation

- **This is post-payment only.** The shipping cost the customer is charged
  at checkout (`src/lib/shipping.ts`, configured in `/admin/settings` as a
  flat rate / free-shipping threshold) is completely separate from — and
  not automatically reconciled with — the actual cost of the label you buy
  here. This is intentional: checkout's charged shipping cost is unchanged
  by this feature.
- Parcel weight/dimensions are entered by hand at label-purchase time
  rather than derived from product data, since `products`/`product_variants`
  only store a freeform `weight_text` field ("50ml", "1kg"), not the
  structured numeric data a shipping API needs.
- Rate-shopping results are stored temporarily on the order's own
  `pending_rates` column (cleared once a label is bought or discarded via
  "Start over") rather than in a separate table — this keeps the label flow
  self-contained per order without new schema surface area.
- `src/lib/shippo.ts` mirrors the lazy-singleton pattern used by
  `src/lib/stripe.ts` and `src/lib/email.ts` — a missing `SHIPPO_API_KEY`
  only breaks the label-purchase flow when it's actually used, not the
  whole build.
