import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Storefront",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Contact us for any enquiries or questions you may have
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Send us a message and we&apos;ll get back to you as soon as we
            can.
          </p>
        </div>

        <div className="rounded-lg bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
