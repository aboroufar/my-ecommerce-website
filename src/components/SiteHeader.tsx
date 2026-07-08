import Link from "next/link";
import { CartLink } from "./CartLink";
import { AccountLink } from "./AccountLink";
import { MegaMenu } from "./MegaMenu";
import { getCategories } from "@/lib/products";

// TODO: replace with real profile URLs once social accounts exist.
const socialLinks = [
  { label: "X", href: "#" },
  { label: "Pinterest", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
];

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="bg-foreground px-6 py-2 text-center text-xs tracking-wide text-background">
        Free shipping on orders over $75
      </div>

      <div className="bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-accent transition-opacity hover:opacity-70"
              >
                <SocialIcon label={social.label} />
              </Link>
            ))}
            <Link
              href="mailto:hello@storefront.example"
              aria-label="Email"
              className="text-accent transition-opacity hover:opacity-70"
            >
              <MailIcon />
            </Link>
          </div>
          <Link
            href="/account"
            className="flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-70"
          >
            <HeartIcon />
            Wishlist
          </Link>
        </div>
      </div>

      <div className="border-b border-line px-6 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted">
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/account/orders" className="transition-colors hover:text-foreground">
              Track an Order
            </Link>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden items-center gap-1 sm:flex">
              <span aria-hidden>+</span> EN
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <span aria-hidden>+</span> US ($)
            </span>
            <SearchIcon />
            <CartLink />
            <AccountLink />
          </div>
        </div>
      </div>

      <div className="border-b border-line px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl"
          >
            Storefront
          </Link>
          <MegaMenu categories={categories} />
        </div>
      </div>

      <nav className="flex items-center gap-6 overflow-x-auto border-b border-line px-6 py-3 text-xs font-medium uppercase tracking-wide text-foreground sm:hidden">
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

function SocialIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    X: "M4 4l16 16M20 4L4 20",
    Pinterest:
      "M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.6l1.4-6s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.7-2.2 3.7-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.5 2.6-5.5 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.4 1.4c0 .2-.2.3-.4.2-1.4-.7-2.3-2.7-2.3-4.4 0-3.6 2.6-6.9 7.5-6.9 4 0 7 2.8 7 6.6 0 3.9-2.5 7.1-5.9 7.1-1.2 0-2.3-.6-2.6-1.3l-.7 2.7c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2Z",
    Instagram:
      "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm5.8-.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z",
    TikTok:
      "M14 2v11.5a3 3 0 1 1-2.5-2.9V8.5A5.5 5.5 0 1 0 17 14V8a6 6 0 0 0 4-1.5V4a4 4 0 0 1-4-2h-3Z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d={paths[label]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path
        d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 6.7C19 15.6 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
