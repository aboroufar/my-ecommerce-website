import Link from "next/link";
import { getActiveProducts, getCategories } from "@/lib/products";
import { getSiteContent } from "@/lib/content";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { BestSellers } from "@/components/BestSellers";
import { TrustBadges } from "@/components/TrustBadges";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SaleSection } from "@/components/SaleSection";
import { CategoryNavBlocks } from "@/components/CategoryNavBlocks";

export default async function Home() {
  const [allProducts, categories, content] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getSiteContent(),
  ]);
  const featuredProducts = allProducts.slice(0, 8);

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[60vh] flex-col justify-center gap-4 bg-surface px-6 py-20 sm:px-16">
        <div className="max-w-xl">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-foreground sm:text-6xl">
            {content["hero.headline"]}
          </h1>
          <p className="mt-3 max-w-md text-lg text-muted">
            {content["hero.subheadline"]}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90"
            >
              {content["hero.cta_primary_label"]}
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-foreground px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {content["hero.cta_secondary_label"]}
            </Link>
          </div>
        </div>
      </section>

      <TrustBadges />

      <CategoryGrid categories={categories} products={allProducts} />

      <FeaturedCarousel products={featuredProducts} />

      <SaleSection products={allProducts} />

      <CategoryNavBlocks categories={categories} />

      <BestSellers products={allProducts} categories={categories} />

      <section className="border-t border-line bg-foreground px-6 py-20 sm:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4">
          <h2 className="font-display text-4xl font-bold text-background">
            {content["closing.headline"]}
          </h2>
          <p className="text-xl text-background/70">
            {content["closing.subheadline"]}
          </p>
          <Link
            href="/products"
            className="mt-4 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            {content["closing.cta_label"]}
          </Link>
        </div>
      </section>
    </main>
  );
}
