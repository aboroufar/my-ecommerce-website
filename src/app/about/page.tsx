import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Storefront",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        About
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        About Us
      </h1>

      <div className="mt-6 border border-dashed border-line bg-surface px-4 py-3">
        <p className="text-xs text-muted">
          This page is a placeholder. Replace it with your real brand story
          before launch.
        </p>
      </div>

      <div className="mt-10 space-y-3 text-sm leading-relaxed text-muted">
        <p>
          Write who you are, why the store exists, and what makes your
          products worth choosing -- founding story, values, sourcing,
          craftsmanship, whatever is true and specific to your brand.
        </p>
      </div>
    </main>
  );
}
