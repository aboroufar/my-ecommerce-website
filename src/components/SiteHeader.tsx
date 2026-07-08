import Link from "next/link";
import { CartLink } from "./CartLink";
import { AccountLink } from "./AccountLink";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-foreground"
        >
          Storefront
        </Link>
        <nav className="flex items-center gap-8 text-xs font-medium uppercase tracking-wide text-muted">
          <Link href="/products" className="transition-colors hover:text-accent">
            Shop
          </Link>
          <AccountLink />
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
