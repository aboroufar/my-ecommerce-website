import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery — Storefront",
};

export default function ShippingPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Help
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        Shipping &amp; Delivery
      </h1>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-foreground">
            Processing time
          </h2>
          <p className="mt-2">
            In-stock orders ship within 2–3 business days of purchase. You&apos;ll
            get an email confirmation as soon as your order is placed.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">
            Where we ship
          </h2>
          <p className="mt-2">
            We currently ship to Italy only. If your address is outside
            Italy, checkout won&apos;t be able to collect a shipping address
            for it yet.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">
            Shipping cost
          </h2>
          <p className="mt-2">
            Free shipping on orders over €75. Standard shipping rates apply
            below that threshold, calculated at checkout based on your
            address and order weight.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-display text-lg font-bold text-foreground">
            Have a question about your order?
          </h2>
          <p className="mt-2">
            Check your order status any time from{" "}
            <Link
              href="/account/orders"
              className="text-foreground underline underline-offset-4"
            >
              your account
            </Link>
            , or see our{" "}
            <Link
              href="/faq"
              className="text-foreground underline underline-offset-4"
            >
              FAQ
            </Link>{" "}
            for more.
          </p>
        </section>
      </div>
    </main>
  );
}
