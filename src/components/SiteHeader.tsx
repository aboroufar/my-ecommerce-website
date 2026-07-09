import Link from "next/link";
import { CartLink } from "./CartLink";
import { AccountLink } from "./AccountLink";
import { MegaMenu } from "./MegaMenu";
import { getCategories } from "@/lib/products";

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="bg-accent px-6 py-2 text-xs text-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="hidden items-center gap-6 sm:flex">
            <Link
              href="mailto:hello@storefront.example"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <MailIcon /> hello@storefront.example
            </Link>
            <span className="flex items-center gap-1.5">
              <PhoneIcon /> 001 23 456 78 910
            </span>
            <span className="flex items-center gap-1.5">
              <PinIcon /> 22ND ST EAST VILLAGE
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium">
            EN <ChevronIcon />
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="shrink-0 font-display text-2xl font-bold uppercase tracking-wide text-foreground"
          >
            Storefront
          </Link>

          <Link
            href="/search"
            aria-label="Search"
            className="hidden max-w-xl flex-1 items-center gap-3 rounded-full bg-surface px-5 py-2.5 text-sm text-muted transition-colors hover:bg-line/60 sm:flex"
          >
            <span className="flex-1">Search</span>
            <SearchIcon />
          </Link>

          <div className="flex shrink-0 items-center gap-5">
            <Link
              href="/account"
              className="hidden text-sm text-foreground transition-opacity hover:opacity-70 lg:inline"
            >
              support@storefront.example
            </Link>
            <AccountLink />
            <Link
              href="/account"
              aria-label="Wishlist"
              className="text-foreground transition-opacity hover:opacity-70"
            >
              <HeartIcon />
            </Link>
            <CartLink />
          </div>
        </div>
      </div>

      <div className="border-t border-line px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="hidden items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground sm:flex">
              <MenuIcon /> Categories
            </span>
            <MegaMenu categories={categories} />
          </div>
          <Link
            href="/account"
            className="hidden rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90 sm:inline-block"
          >
            Contact us
          </Link>
        </div>
      </div>

      <nav className="flex items-center gap-6 overflow-x-auto border-t border-line px-6 py-3 text-xs font-medium uppercase tracking-wide text-foreground sm:hidden">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="shrink-0 transition-colors hover:text-accent"
          >
            {category.name}
          </Link>
        ))}
        <Link href="/products" className="shrink-0 transition-colors hover:text-accent">
          Shop all
        </Link>
      </nav>
    </header>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path
        d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 2 6a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path
        d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 6.7C19 15.6 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
