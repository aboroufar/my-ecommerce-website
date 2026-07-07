import Link from "next/link";
import { CartLink } from "./CartLink";
import { AccountLink } from "./AccountLink";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-foreground"
        >
          Storefront
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/products" className="transition-colors hover:text-foreground">
            Shop
          </Link>
          <AccountLink />
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
