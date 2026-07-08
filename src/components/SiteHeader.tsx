import Link from "next/link";
import { CartLink } from "./CartLink";
import { AccountLink } from "./AccountLink";
import { getCategories } from "@/lib/products";

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="bg-foreground px-6 py-2 text-center text-xs tracking-wide text-background">
        Free shipping on orders over $75
      </div>

      <div className="border-b border-line px-6 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-4">
            <Link href="/account/orders" className="transition-colors hover:text-foreground">
              Track an order
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <AccountLink />
          </div>
        </div>
      </div>

      <div className="border-b border-line px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="font-display text-3xl font-bold uppercase tracking-wide text-foreground"
          >
            Storefront
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-wide text-foreground sm:flex">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="transition-colors hover:text-accent"
              >
                {category.name}
              </Link>
            ))}
            <Link href="/products" className="transition-colors hover:text-accent">
              Shop all
            </Link>
          </nav>
          <div className="flex items-center gap-5 text-xs font-medium uppercase tracking-wide text-foreground">
            <CartLink />
          </div>
        </div>
      </div>
    </header>
  );
}
