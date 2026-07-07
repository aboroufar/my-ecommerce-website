# Email setup (Resend)

## 1. Get an API key
Sign up at resend.com, then **API Keys → Create API Key**. Put it in
`RESEND_API_KEY` in `.env.local`.

## 2. Zero-setup testing (works immediately)
By default `EMAIL_FROM` is set to `Storefront <onboarding@resend.dev>` --
Resend's shared test sender. It works with no domain setup, but **only
delivers to the email address on your own Resend account** (a safety
limit for the shared sender). This is enough to test the full checkout →
email flow yourself before going live.

## 3. Verify a real domain (for real customers)
Before customers other than you can receive order emails:
1. In Resend: **Domains → Add Domain**, enter your domain
   (e.g. `yourstore.com`).
2. Add the DNS records Resend shows you (SPF, DKIM, and a tracking CNAME)
   at your domain registrar / DNS provider. This is standard practice for
   any transactional email sender, not a Resend-specific requirement --
   it's how receiving mail servers verify you're allowed to send as your
   domain, and it directly affects whether your emails land in the inbox
   or in spam.
3. Wait for verification (usually a few minutes, sometimes longer for DNS
   propagation).
4. Update `EMAIL_FROM` to something like `Storefront <orders@yourstore.com>`
   in `.env.local` and in Vercel.

## 4. Test it
Run through a full checkout locally (see `STRIPE.md`) using an email
address you can actually check. Once `stripe listen` forwards the
`checkout.session.completed` event, you should get the confirmation
email within a few seconds.

## Notes on the current implementation
- Email sending happens inside the Stripe webhook handler, *after* the
  order is marked paid and stock is decremented -- and a failed send is
  only logged, never thrown. If email sending could fail the webhook,
  Stripe would retry the entire event, re-running an order that already
  succeeded. Check your server logs (or Vercel's function logs) if a
  confirmation email doesn't arrive; the order itself is unaffected either way.
- The email template lives in `src/emails/OrderConfirmationEmail.tsx`,
  built with React Email components rather than hand-written HTML tables --
  hand-rolled email HTML is notoriously fragile across Outlook/Gmail/Apple
  Mail, and React Email's components are specifically built and tested
  against those quirks.
- The "View your order" link in the email only appears for logged-in
  shoppers (guest checkout orders have no `/account/orders/:id` a guest
  could sign in to see, since there's no account to view it from).
