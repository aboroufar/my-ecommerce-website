import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Storefront",
};

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: "How do I track my order?",
    answer: (
      <>
        Sign in and go to{" "}
        <Link href="/account/orders" className="text-foreground underline underline-offset-4">
          your orders
        </Link>{" "}
        to see the status of anything you&apos;ve purchased. You&apos;ll also get
        an email confirmation when your order is placed.
      </>
    ),
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards through Stripe's secure checkout.",
  },
  {
    question: "Where do you ship?",
    answer: (
      <>
        The United States, Canada, the United Kingdom, and Italy. See{" "}
        <Link href="/shipping" className="text-foreground underline underline-offset-4">
          Shipping &amp; Delivery
        </Link>{" "}
        for details.
      </>
    ),
  },
  {
    question: "How long does shipping take?",
    answer:
      "Orders ship within 2–3 business days. Shipping is free on orders over $75.",
  },
  {
    question: "Do I need an account to check out?",
    answer:
      "No — guest checkout is available. Creating an account lets you track order history and save addresses for next time.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Help
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        Frequently asked questions
      </h1>

      <div className="mt-10 divide-y divide-line border-t border-line">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
              {faq.question}
              <span className="shrink-0 text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Don&apos;t see your question here?{" "}
        <a
          href="mailto:hello@storefront.example"
          className="text-foreground underline underline-offset-4"
        >
          Email us
        </a>{" "}
        and we&apos;ll help you out.
      </p>
    </main>
  );
}
