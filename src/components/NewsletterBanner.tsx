import { NewsletterSignup } from "./NewsletterSignup";

/**
 * No fake discount/offer copy here (e.g. "30% off, August only") -- that's
 * a real business decision only the store owner can make, and inventing a
 * discount with no matching code enforced at checkout would just be a lie
 * to customers. Generic "stay in the loop" copy until a real offer exists.
 */
export function NewsletterBanner() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-2">
        <div className="flex min-h-[220px] flex-col justify-end bg-foreground p-8 text-background sm:p-10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Storefront
          </span>
          <p className="mt-2 max-w-sm text-lg font-medium">
            Small-batch essentials, made to be used.
          </p>
        </div>
        <div className="flex flex-col justify-center bg-surface p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Join our newsletter
          </h2>
          <p className="mt-2 text-sm text-muted">
            New products, restocks, and the occasional sale — straight to
            your inbox.
          </p>
          <div className="mt-6 max-w-md">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </section>
  );
}
