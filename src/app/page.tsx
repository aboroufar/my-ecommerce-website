import Link from "next/link";
import { getActiveProducts, getCategories } from "@/lib/products";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { BestSellers } from "@/components/BestSellers";
import { TrustBadges } from "@/components/TrustBadges";

export default async function Home() {
  const [allProducts, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);
  const featuredProducts = allProducts.slice(0, 8);

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[70vh] flex-col justify-center gap-4 bg-surface px-6 py-20 sm:px-16">
        <div className="max-w-xl">
          <h1 className="font-display text-6xl font-bold leading-[1.05] text-foreground sm:text-7xl">
            Considered goods, elevated.
          </h1>
          <p className="mt-3 font-display text-2xl italic text-foreground/80">
            Made with restraint. Built to last.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="bg-foreground px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
            >
              Shop all
            </Link>
            <Link
              href="/products"
              className="border border-foreground px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Find your routine
            </Link>
          </div>
        </div>
      </section>

      <TrustBadges />

      <FeaturedCarousel products={featuredProducts} />

      <BestSellers products={allProducts} categories={categories} />

      <section className="border-t border-line bg-surface px-6 py-20 sm:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4">
          <h2 className="font-display text-4xl font-bold text-foreground">
            Your routine, simplified.
          </h2>
          <p className="font-display text-xl italic text-muted">
            Three steps. Real results.
          </p>
          <Link
            href="/products"
            className="mt-4 border border-foreground px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Build your routine
          </Link>
        </div>
      </section>
    </main>
  );
}
