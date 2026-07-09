import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-4xl font-bold uppercase tracking-wide text-foreground">
          Storefront
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <h3 className="font-display text-lg text-foreground">About</h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Small-batch essentials, formulated with restraint and made to
              be used — not just displayed.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/products" className="transition-colors hover:text-foreground">
                  Shop all
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition-colors hover:text-foreground">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="transition-colors hover:text-foreground">
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Accounts</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/account" className="transition-colors hover:text-foreground">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="transition-colors hover:text-foreground">
                  Track an order
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-6 text-center text-xs uppercase tracking-wide text-muted">
          © {new Date().getFullYear()} Storefront. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
