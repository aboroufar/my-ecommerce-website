<reference-prompt>
# Summary

Warm, editorial skincare/beauty storefront ("Veroné-inspired" rebrand) built on Next.js App Router + Tailwind CSS v4. Espresso-brown chrome, warm cream body, serif headings paired with a geometric sans body font, and pill-shaped interactive elements throughout.

# Style

The style pairs a minimal editorial layout with a warm, tactile palette: cream/beige backgrounds, a near-black espresso-brown header and footer, and a muted tan accent. Headings use an elegant serif; body copy and UI chrome stay in a clean geometric sans. Corners are either fully rounded (`rounded-full` pills for buttons, badges, inputs, dropdowns) or generously rounded (`rounded-xl`/`rounded-2xl` for cards and image tiles) — no sharp corners appear on customer-facing surfaces. Depth comes from soft shadows on hover, not borders or heavy elevation.

## Spec

**Colors** (CSS custom properties in `src/app/globals.css`, exposed as Tailwind classes via `@theme inline`):
- `--background: #F7F3EE` — warm cream, page body
- `--foreground: #201E1C` — near-black, body text (stays dark for readability; NOT the header/footer color)
- `--header-footer: #2B2118` — espresso-brown, used only for the header's top bar and the full footer (`bg-header-footer`)
- `--header-footer-text: #F7F3EE` — text/icon color on the espresso-brown surfaces (`text-header-footer-text`)
- `--accent: #A97C52` — warm tan, primary interactive accent (buttons, active states)
- `--accent-text: #865B35` — darker tan, used for small static text/links on `--background` where `--accent` itself fails WCAG AA contrast (4.5:1) for normal text
- `--accent-soft: #F0E6DA` — light warm beige, used for card backgrounds and image-tile placeholder fills
- `--secondary-accent: #5F806F` — muted sage green, reserved/rarely used
- `--surface: #FFFEFB` — near-white warm surface, used for image tiles and bordered UI chrome (sidebar, dropdowns)
- `--muted: #6B5D50` — warm gray-brown, secondary/muted text
- `--line: #E8DFD3` — warm beige border color, all hairline borders
- `--sale: #B94F3B` — muted red, sale/discount badges only

**Typography**: Two font families, loaded via `next/font/google` in `src/app/[locale]/layout.tsx`:
- `--font-sans` (Figtree, weights 400–700) — body text, always
- `--font-display` (Playfair Display, weights 400–700) — headings, logo, product names, section titles. **Storefront-only**: applied via a `.storefront` class-scoped CSS override on the `<html>` element in the `[locale]` layout. The separate `/admin` layout (its own `<html>` root, no shared parent) never gets this class, so admin headings stay on Figtree/`--font-sans` by inheritance from the base `--font-display` fallback. This lets the two areas diverge stylistically from one shared token without per-component edits.
- Use `font-display` for: page `<h1>`/`<h2>`, product names, section headings, logo wordmark.
- Use default (`font-sans`, inherited) for: body copy, labels, buttons, nav links, prices.

**Border radius**:
- `rounded-full` — ALL buttons (primary CTAs, pills, icon buttons), badges, form inputs (text/email/select), quantity steppers, filter dropdowns, toggle chips.
- `rounded-2xl` — product cards (outer container).
- `rounded-xl` — image tiles within cards.
- `rounded-lg` — sidebar container, misc small cards.
- No sharp (`rounded-none`/`rounded-sm`) corners on customer-facing surfaces. `admin/*` uses its own distinct system — `rounded-md` cards on a gray canvas — see **Admin Panel** below; it is intentionally NOT styled per the tokens on this page.

**Shadows/elevation**: no static borders-as-depth on cards; instead use hover-triggered soft shadow + lift:
```
hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(32,30,28,0.10)]
transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
```
Buttons use a lighter version: `hover:-translate-y-0.5 hover:shadow-md`.

**Focus states** (accessibility, global in `globals.css`):
```css
:where(a, button, input, select, textarea):focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent) 70%, white);
  outline-offset: 3px;
}
```

**Motion**: `prefers-reduced-motion: reduce` collapses all animation/transition durations to near-zero globally — never rely on motion alone to convey state.

# Layout & Structure

A standard storefront shell: sticky header → routed page content → footer. Homepage is a **data-driven, admin-toggleable stack of sections** (not hardcoded) — see Homepage Sections below.

## Header (`src/components/SiteHeader.tsx`)

Three stacked bars, sticky (`sticky top-0 z-40`), `bg-background/95 backdrop-blur`:
1. **Top bar** — `bg-header-footer text-header-footer-text`, 12px text, contact info (email/phone/address) left, locale switcher right. Hidden fields on mobile.
2. **Main row** — 3-column grid (logo | search | icons). Logo: `font-display text-xl sm:text-3xl font-bold uppercase tracking-[0.06em]`, optional circular logo image (`rounded-full`) + site name from `site_settings`. Center: inline search bar. Right: search icon (mobile), email (desktop), account, wishlist heart, cart icon.
3. **Mega menu row** (desktop only) — categories dropdown left, extra menu columns center, `rounded-full bg-accent text-background` "Contact us" pill right.
4. **Mobile category scroll row** — horizontal scrolling category links, sm:hidden.

## Footer (`src/components/SiteFooter.tsx`)

`bg-header-footer text-header-footer-text`. 4-column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`): Brand/about, Help links, Accounts links, Newsletter signup (reuses `NewsletterSignup` component). All link/text colors use `text-header-footer-text` with `/70` or `/20` opacity modifiers for secondary text and dividers — never raw `--background`/`--foreground` tokens inside this dark container. Bottom bar: payment icons, copyright, privacy/terms links, centered.

## Hero (`src/components/HeroSlideshow.tsx`)

Full-bleed auto-advancing image slideshow (6s interval), `min-h-[31rem] sm:min-h-[34rem] lg:min-h-[38rem]`. Left-to-right dark gradient scrim (`bg-gradient-to-r from-foreground/80 via-foreground/45 to-transparent`) for text legibility. Left-aligned text block: eyebrow label (`text-xs uppercase tracking-[0.22em]`), `font-display` headline (`text-4xl sm:text-6xl lg:text-7xl font-bold`), optional description, pill CTA (`rounded-full bg-background text-foreground`). Circular prev/next chevron buttons, bottom-left mobile / vertically-centered-sides desktop.

## Homepage Sections (data-driven registry)

Source of truth: `src/lib/homepageSections.ts` (`HomepageSectionKey` union + `homepage_sections` Supabase table for enable/order), rendered via a `sectionComponents` map in `src/app/[locale]/page.tsx`. Admin can toggle/reorder any section from `/admin/content`. Current keys, in default order:

1. `hero` — HeroSlideshow
2. `category_grid` — CategoryGrid (rounded-2xl image tiles, dark gradient overlay, bottom-left label)
3. `sale` — SaleSection (pill category filter chips + ProductCard grid)
4. `promo_banner` — PromoBanner (centered, `bg-accent-soft`, eyebrow + heading + body + pill CTA; static copy, no admin field yet)
5. `best_sellers` — BestSellers (pill category filter chips, active state `bg-foreground text-background`)
6. `journal` — JournalSection (3-card editorial grid reusing real published blog posts via `getPublishedPosts()`; renders nothing if fewer than 3 posts exist — never fakes content)
7. `newsletter_photo` — NewsletterPhotoSection (dark `bg-header-footer` two-column block: copy + `NewsletterSignup` left, image/gradient placeholder right)
8. `brand_bar` — BrandBar (circular brand logos)

When adding a new homepage section: extend the `HomepageSectionKey` union, add a `defaults` entry, add a migration `insert into homepage_sections (...)`, register the component in `page.tsx`'s `sectionComponents` map. Never hardcode a new section directly into the page outside this registry.

## Product Grid (`/products`, `src/app/[locale]/products/page.tsx`)

Top bar: pill `SortDropdown` left, breadcrumb right. Body: `ProductsGridLayout` client wrapper holding a "Hide filter" pill toggle (`rounded-full border border-line`) — hiding the sidebar (`ShopSidebar`, bordered `rounded-lg`) expands the grid from `sm:grid-cols-3` to `sm:grid-cols-3 lg:grid-cols-4`. Filter dropdowns (Category/Brand/Gender/Price) are all `rounded-full border border-line`. Filter categories today: Category, Brand, Gender, Price range — no tag/attribute-based filtering exists.

## Product Card (`src/components/ProductCard.tsx`)

```
outer: rounded-2xl bg-accent-soft p-2, hover:-translate-y-1 + shadow
  floating action column (wishlist/quick-view/compare), circular icon buttons, top-right
  image tile: aspect-square rounded-xl bg-surface, badges top-left (Sale=bg-sale, Popular=bg-accent, both pill)
  body: category label, font-display product name, star rating, 2-line description
  footer: price row (was/now), then full-width pill "Add to cart" button (rounded-full bg-foreground)
```
Note: the Add to cart button spans the full card width below the price — NOT a small circular icon button.

## Product Detail Page (`src/app/[locale]/products/[slug]/page.tsx` + `AddToCartButton.tsx`)

Two-column (`grid-cols-1 lg:grid-cols-2`): flat square product image left (no rounding, unlike the grid's rounded tile), info column right — eyebrow, `font-display` `<h1>`, star rating, price row with pill percent-off badge, highlights list, Add to Cart control. The Add to Cart control is a pill quantity stepper (`rounded-full border border-line`, contiguous −/qty/+ segments) beside a full-width pill submit button (`flex-1 rounded-full bg-foreground py-4 uppercase`) — this is the canonical full-width-pill-button pattern the ProductCard button was made to match.

# Admin Panel (`/admin/*`)

The admin panel deliberately does NOT use the storefront tokens/spec above — it follows Shopify's own admin visual language instead: a light gray page canvas with white rounded-corner cards floating on top, a plain-sans (no serif) sidebar, and neutral-gray interactive states rather than the storefront's tan accent. This is intentional, not an inconsistency — see Content & Data Discipline below for why the two areas are allowed to diverge.

## Canvas & Layout (`src/app/admin/layout.tsx`)

- Page background: `#f1f1f1` (light gray), set via inline `style` on `<body>` — not a CSS custom property, since admin has its own `<html>`/`<body>` root entirely separate from the storefront's `[locale]` layout (no shared parent, so nothing here can leak into customer-facing pages).
- Content area: `mx-auto w-full max-w-5xl px-6 py-8`, sitting beside the fixed sidebar.
- Sections are built from stacked white `SettingsCard`s (see below), never raw bordered blocks directly on the gray canvas.

## Sidebar (`src/components/admin/AdminSidebar.tsx`)

```
bg-white, w-60, h-screen, no border
wordmark row: StoreIcon + "Admin", plain text-sm font-semibold text-neutral-900 (NOT font-display/serif)
nav item (active):   bg-neutral-100 font-medium text-neutral-900
nav item (inactive):  text-neutral-700, hover:bg-neutral-100 hover:text-neutral-900
```
Nav items with children (Clients→Segments; Settings→General/Shipping/Payments/Checkout/Customer accounts/Users, with Roles nested one level further under Users) render the children as an always-expanded indented list (`pl-8`, no border-left rule) whenever the parent route is active — not a collapsible toggle, matching Shopify's own always-expanded child pattern. A parent counts as "active" (keeping its children expanded) if the current path matches the parent's own href *or* any child's href — Settings' Users/Payments children live under different URL prefixes (`/admin/users`, `/admin/settings/payments`) than the parent itself, so `isParentActive()` in `AdminSidebar.tsx` checks both, not just the parent's own route. Footer of the sidebar: a blue initials avatar chip (`bg-blue-500 text-white`, first two letters of the email, uppercased) + truncated email + sign-out link, above a `border-t border-neutral-200` divider.

**Nav visibility is role-filtered**, not just decorative: `AdminSidebar` takes a `role` prop and calls `roleHasSection()` (`src/lib/permissions.ts`) to hide any top-level item, child, or grandchild link the signed-in admin's role doesn't cover. See `src/lib/permissions.server.ts`'s `requireSection()` for the matching server-action-side enforcement — every admin section is gated in both places, not nav-only.

**Menu nesting is flat by default, with one explicit exception for Users→Roles**: `NavItem.children` is a `ChildNavItem[]`, and `ChildNavItem` itself has an optional `children` field one level deeper — this isn't a general recursive tree (`SidebarLink` only renders that one extra level, it doesn't recurse arbitrarily), it exists specifically because Roles is a child of Users, not a sibling. The confirmed structure is: Settings → General, Shipping and delivery, Payments, Users → Roles. `/admin/users` renders under Settings (`section: "users"`, distinct from Settings' own `"settings"` section, so a role with Settings access but not Users access still won't see it), and `/admin/users/roles` renders nested one level under the Users entry itself, expanding only when `/admin/users` or `/admin/users/roles` is the active route.

## SettingsCard (`src/components/admin/SettingsCard.tsx`)

The core building block for every `/admin/settings/*` and `/admin/users/*` page — a white rounded card floating on the gray canvas, replacing the old customer-facing pattern of bordered blocks directly on white.

```
section: rounded-lg border border-neutral-200 bg-white p-5 shadow-sm
title:   text-sm font-semibold text-neutral-900
description: mt-1 max-w-lg text-sm text-neutral-500
body:    mt-4 max-w-lg
```
Pages stack multiple `SettingsCard`s in a `flex flex-col gap-4` column — one card per logical group (e.g. "Site information", "Store defaults", "Business details", "Store activity log" are four separate cards on the same page, not one long form).

## Admin Form Controls

Shared local `const` class strings per page (not yet extracted to a shared module — repeat this exact spec if adding a new admin form page):
```
input/select: rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500
label text:   text-sm text-neutral-700
help text:    text-xs text-neutral-500
primary button: rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-800
```
No pill shapes, no `--accent` tan anywhere in admin — buttons are square-cornered (`rounded-md`) and near-black, matching Shopify's own admin button treatment. Destructive inline actions (e.g. "Remove" on an admin user row) are plain `text-xs text-red-600 underline` links, not buttons.

## Role-Gated Sections in the UI

Some cards/pages should only render for admins whose role actually covers that section (defense in depth alongside `requireSection` on the action itself) — fetch the caller's own role server-side (`getAdminUser()` + `getAdminRole()` from `src/lib/auth.ts`) and wrap the JSX in that check, e.g. the Users/Roles pages are only reachable by the `admin` role; a restricted role never sees them in the sidebar OR the page content if they hit the URL directly.

# Special Components

## Pill Button (primary CTA)

The single most repeated interactive pattern site-wide.

```
rounded-full bg-foreground text-background
px-6 py-2.5–4 (size varies by context)
text-xs–sm font-medium/semibold uppercase tracking-wide
transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md
```
Secondary/outline variant: `rounded-full border border-foreground` inverting to filled on hover (used for "View all" links).

## Badge (Sale / Popular / status)

```
rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide
bg-sale text-background   (Sale)
bg-accent text-background (Popular)
```
Always top-left of the image tile, stacked with `flex gap-1.5` if both present.

## Filter/Sort Dropdown

```
appearance-none rounded-full border border-line bg-surface (or bg-background)
px-4 py-2.5 pr-9 text-sm
+ absolutely-positioned chevron SVG icon
focus:border-foreground
```

## Newsletter Form (`src/components/NewsletterSignup.tsx`)

Designed exclusively for dark (`--header-footer`) containers — used in the footer and the newsletter-photo homepage section, never on a light background.
```
input: flex-1 rounded-full border border-header-footer-text/30 bg-transparent
       text-header-footer-text placeholder:text-header-footer-text/50
button: rounded-full bg-header-footer-text text-header-footer
```

## Card hover lift (ProductCard, general content cards)

```
transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(32,30,28,0.10)]
```

# Content & Data Discipline

This codebase treats fake/placeholder data as a defect, not a shortcut — carry this forward for any future design work:
- New homepage sections must render from real data (`getPublishedPosts()`, real product/category queries) and should render `null`/nothing rather than show placeholder content when data is insufficient (see `JournalSection`'s "fewer than 3 posts → don't render" rule).
- If a design calls for content with no backing field (e.g. promo banner copy, a hero photo), either wire a real admin-editable field, reuse an existing one, or use a clearly generic placeholder and flag it as a follow-up — never fabricate specific claims/numbers/testimonials.
- `/admin` is a structurally separate area (own `<html>` root, own font loading in `src/app/admin/layout.tsx`) — styling changes scoped to "the storefront" should use the `.storefront`-class-scoping pattern (see Typography) rather than editing shared tokens in a way that also changes `/admin`.

# How to Reuse This Doc

When requesting a UI change, reference this file and specify:
1. Which section/page/component (use the paths above).
2. Whether it's a **token change** (edit `globals.css`, cascades everywhere) vs a **component-local** change.
3. Confirm whether admin panel should also be affected (default: no, per the `.storefront` scoping pattern).
4. Confirm whether any new content needs a real data source before it's built (per Content & Data Discipline above).
</reference-prompt>
