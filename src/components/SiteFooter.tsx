import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";
import { PaymentIcons } from "./PaymentIcons";
import { getSiteContent } from "@/lib/content";

export async function SiteFooter() {
  const content = await getSiteContent();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-display text-xl font-bold uppercase tracking-wide">
              Storefront
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-background/70">
              {content["footer.about_text"]}
            </p>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li>
                <Link href="/products" className="transition-colors hover:text-background">
                  Shop all
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition-colors hover:text-background">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="transition-colors hover:text-background">
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-background">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/returns" className="transition-colors hover:text-background">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">Accounts</h3>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li>
                <Link href="/account" className="transition-colors hover:text-background">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="transition-colors hover:text-background">
                  Track an order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-background">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">
              Subscribe to our emails
            </h3>
            <p className="mt-3 text-sm text-background/70">
              New products, restocks, and the occasional sale.
            </p>
            <div className="mt-4">
              <NewsletterSignup />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-background/20 pt-6">
          <PaymentIcons />
          <div className="mt-4 flex flex-col items-center gap-2 text-xs uppercase tracking-wide text-background/70">
            <p>© {new Date().getFullYear()} Storefront. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition-colors hover:text-background">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-background">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
