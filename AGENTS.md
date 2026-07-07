<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project: Storefront (e-commerce)

Stack: Next.js (App Router, TypeScript) + Tailwind, hosted on Vercel.
Planned additions: Supabase (Postgres + Auth + Storage), Stripe (Checkout + webhooks),
Resend (transactional email). See `/docs/architecture.md` (to be added) for the full plan.

Conventions:
- `src/app` — routes only. Keep pages thin; push logic into `src/lib`.
- `src/components` — shared UI components (create as needed).
- `src/lib` — data access, Stripe/Supabase clients, validation schemas.
- Use Zod for all external input validation (forms, webhooks, API routes).
- No secrets in code — use environment variables (`.env.local`, never committed).

Don't touch without re-testing:
- Stripe webhook signature verification logic (`src/app/api/webhooks/stripe/route.ts`).
- Price calculation in `src/app/api/checkout/route.ts` — prices are always
  re-fetched from Supabase server-side, never trusted from the client. Do not
  change this to accept a price from the request body.
- `decrement_stock` Postgres function / its call site in the webhook handler —
  this exists specifically to avoid a race condition between concurrent
  orders for the same product. Don't replace it with a plain read-then-write.
- `src/lib/supabase/types.ts` — Insert/Update fields must stay as plain
  literal object types, not `Partial<Row>`/`Pick<Row, K>` computed types.
  The latter silently breaks postgrest-js's query type inference (all
  `.select()` results become `never`). This file should ideally be replaced
  entirely by `supabase gen types` once a real project is linked.
- `src/lib/actions/products.ts` — every server action calls `requireAdmin()`
  itself; don't remove that just because the `/admin` layout also checks.
  Server Actions are network-callable directly, so the layout check alone
  isn't sufficient protection.
- `src/components/SiteHeader.tsx` / `AccountLink.tsx` — the account link
  checks auth state *client-side* on purpose. `SiteHeader` is in the root
  layout, so any `cookies()`-dependent call there (e.g. a server-side
  `getSessionUser()`) forces every page in the site to render dynamically,
  silently destroying the SSG/ISR setup on `/` and `/products`. Keep
  session checks out of the root layout; do them client-side or in
  route-specific layouts (like `/admin` and `/account`) instead.
- `src/lib/email.ts` — `sendOrderConfirmationEmail` deliberately swallows
  its own errors (logs, never throws). It's called from the Stripe webhook
  handler after the order is already marked paid; if a send failure threw,
  Stripe would retry the whole webhook event and re-run order processing
  that already succeeded.

