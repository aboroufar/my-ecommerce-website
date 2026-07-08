import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center gap-6 overflow-hidden bg-accent-soft px-6 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
          New collection
        </span>
        <h1 className="max-w-2xl font-display text-5xl font-medium leading-[1.1] text-foreground sm:text-7xl">
          Considered goods,
          <br />
          plainly made.
        </h1>
        <p className="max-w-md text-base text-muted">
          Small-batch essentials, formulated with restraint and made to be
          used — not just displayed.
        </p>
        <Link
          href="/products"
          className="mt-4 bg-accent px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          Shop the collection
        </Link>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-20 sm:grid-cols-3">
        {[
          {
            title: "Thoughtfully sourced",
            copy: "Every ingredient and material is chosen for quality first, trend second.",
          },
          {
            title: "Made in small batches",
            copy: "We produce in limited runs to keep quality consistent and waste low.",
          },
          {
            title: "Built to last",
            copy: "Designed for daily use for years, not a single season.",
          },
        ].map((item) => (
          <div key={item.title} className="text-center sm:text-left">
            <h2 className="font-display text-2xl text-foreground">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {item.copy}
            </p>
          </div>
        ))}
      </section>

      <section className="border-t border-line bg-accent-soft px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            The edit
          </span>
          <h2 className="max-w-xl font-display text-4xl text-foreground">
            Shop the full collection
          </h2>
          <Link
            href="/products"
            className="mt-2 border border-foreground px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            View all products
          </Link>
        </div>
      </section>
    </main>
  );
}
