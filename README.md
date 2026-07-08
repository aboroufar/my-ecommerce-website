# Storefront

An e-commerce storefront built with Next.js (App Router, TypeScript), Supabase, Stripe, and Resend, deployed on Vercel.

> **Note:** this project pins a Next.js version with breaking changes from
> what most training data / tutorials assume (e.g. `proxy` replacing
> `middleware`). See `AGENTS.md` and `node_modules/next/dist/docs/` before
> assuming an API works the way you remember.

## Stack

| Concern              | Choice                                   |
| --------------------- | ----------------------------------------- |
| Framework             | Next.js App Router + TypeScript           |
| Styling               | Tailwind CSS                              |
| Database + Auth       | Supabase (Postgres, Row Level Security, email magic links) |
| Payments              | Stripe (Checkout Sessions + webhooks)     |
| Transactional email    | Resend (+ `react-email` templates)        |
| Validation             | Zod, on every external input boundary     |
| Hosting                | Vercel                                    |

## Project layout

```
src/app         routes only -- pages stay thin, logic lives in src/lib
src/components  shared UI (client + server components)
src/lib         data access, Supabase/Stripe clients, validation, server actions
src/emails      react-email templates rendered for outgoing mail
supabase/       SQL migrations + seed data, applied via Supabase CLI or SQL Editor
```

Within `src/lib`:

- `supabase/server.ts` — cookie-aware client for Server Components/Actions/Route Handlers. Respects RLS as the logged-in user.
- `supabase/client.ts` — browser client for Client Components. Also RLS-scoped.
- `supabase/public.ts` — anon-key client with no cookie/session handling, for cacheable public reads (catalog pages, ISR revalidation, `generateStaticParams`).
- `supabase/admin.ts` — service-role client. Bypasses RLS entirely. Server-only; used in webhook handlers and admin server actions where the request needs to write regardless of the caller's RLS grants.
- `supabase/middleware.ts` — refreshes the Supabase auth cookie on every request (required by `@supabase/ssr`; only middleware/proxy can write refreshed cookies back).
- `auth.ts` — `getSessionUser()` / `getAdminUser()` / `isAdminEmail()`. Admin access is a flat comma-separated allow-list (`ADMIN_EMAILS`) checked against the logged-in user's email — no roles table, appropriate for a store run by one or a few people.
- `stripe.ts`, `email.ts` — thin wrappers around the Stripe SDK and Resend.

## Data model

Defined in `supabase/migrations/`, applied in order:

1. **Catalog** — `categories`, `products`, `product_categories`, `product_images`. Public-read (active products/categories only), write-only via the service-role key (admin server actions). No RLS write policies exist for `anon`/`authenticated` on purpose.
2. **Customers & cart** — `customers` (1:1 with `auth.users`, auto-created via trigger on signup), `addresses`, `carts`, `cart_items`. RLS restricts each customer to their own rows.
3. **Orders** — `orders`, `order_items`. Created server-side only (service-role key), after Stripe confirms payment. Customers get read-only access to their own orders; there are no client-side write policies.
4. **`decrement_stock`** — a Postgres function (not a plain read-then-write) that atomically decrements `stock_qty`, returning `false` on insufficient stock. This exists specifically to avoid a race condition between two concurrent orders for the same product.

## Request/data flow

**Browsing:** product pages are statically generated (`generateStaticParams` + ISR) using the public Supabase client, so most of the storefront is served from Vercel's edge cache rather than hitting Supabase on every request.

**Cart:** client-only state (`CartProvider`, React `useReducer` + `localStorage`). No server round-trip until checkout — the cart itself is never persisted to Supabase for guests.

**Checkout** (`src/app/api/checkout/route.ts`):
1. Client sends only `{ productId, quantity }[]` — never a price.
2. Server re-fetches canonical price, stock, and status from Supabase for every line item. Tampering with prices client-side has no effect.
3. An `orders` row is inserted with `status: "pending"` *before* redirecting to Stripe, so the webhook has something to update rather than trusting anything from the redirect itself.
4. A Stripe Checkout Session is created and its URL returned; if Stripe session creation fails, the pending order is rolled back so it doesn't accumulate as an orphan.

**Payment confirmation** (`src/app/api/webhooks/stripe/route.ts`):
1. Verifies the Stripe webhook signature against the raw request body.
2. On `checkout.session.completed`: marks the order `paid` (idempotently — a second delivery of the same event is a no-op), calls `decrement_stock` per line item, and sends an order confirmation email.
3. On `checkout.session.expired`: cancels the order, but only if it's still `pending` (never overwrites an order that already paid).
4. Email failures are caught and logged, never thrown — the order is already paid and stock already decremented by that point, so a thrown error would make Stripe retry the whole webhook and redo work that already succeeded.

**Auth:** Supabase email magic links (no passwords). Session cookies are refreshed by `src/middleware.ts` on every request. `SiteHeader`/`AccountLink` check auth state *client-side* on purpose — `SiteHeader` lives in the root layout, and any cookie-dependent server call there would force every page (including the otherwise-static `/` and `/products`) to render dynamically. Session-dependent logic is confined to route-specific layouts (`/admin`, `/account`) instead.

**Admin** (`/admin`): gated by `AdminLayout` (session + `isAdminEmail` check) *and* independently by every server action in `src/lib/actions/products.ts`, since Server Actions are directly network-callable and the layout check alone doesn't protect them.

## Environment variables

See `.env.local.example` for the full list with descriptions. Summary:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase client config |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS — never exposed to the client |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signature verification |
| `ADMIN_EMAILS` | Comma-separated allow-list for `/admin` access |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email |
| `SITE_URL` | Absolute origin used to build links inside emails sent from the webhook (no browser request to infer an origin from there) |

## Setup

- Supabase: see `supabase/README.md`
- Stripe: see `STRIPE.md`
- Email: see `EMAIL.md`

```bash
npm install
cp .env.local.example .env.local   # fill in real values
npm run dev
```

## Deployment

Hosted on Vercel, auto-deploying from `main`. Production environment variables are set in the Vercel project settings (not committed). See `STRIPE.md` §4–5 for wiring up the production webhook endpoint and switching to live-mode keys.

## Things that look editable but aren't (without care)

See `AGENTS.md` for the full list and reasoning; the short version:

- Stripe webhook signature verification
- Server-side price re-fetching in `/api/checkout` (never trust a client-submitted price)
- `decrement_stock` and its call site (avoids a stock race condition)
- `src/lib/supabase/types.ts` — Insert/Update fields must stay literal object types, not `Partial<Row>`/`Pick<Row, K>`, or postgrest-js's type inference silently breaks
- `src/lib/actions/products.ts` — per-action `requireAdmin()` calls
- Keeping session/cookie checks out of the root layout (`SiteHeader`/`AccountLink`)
- `sendOrderConfirmationEmail` swallowing its own errors
