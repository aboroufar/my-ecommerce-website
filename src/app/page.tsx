import Link from "next/link";
import { getActiveProducts, getCategories } from "@/lib/products";
import { getSiteContent } from "@/lib/content";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { BestSellers } from "@/components/BestSellers";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SaleSection } from "@/components/SaleSection";
import { CategoryNavBlocks } from "@/components/CategoryNavBlocks";
import { NewsletterBanner } from "@/components/NewsletterBanner";
import { HeroSlideshow } from "@/components/HeroSlideshow";

export default async function Home() {
  const [allProducts, categories, content] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getSiteContent(),
  ]);
  const featuredProducts = allProducts.slice(0, 8);

  return (
    <main className="flex flex-1 flex-col">
      <HeroSlideshow categories={categories} />

      <CategoryGrid categories={categories} products={allProducts} />

      <FeaturedCarousel products={featuredProducts} />

      <SaleSection products={allProducts} />

      <CategoryNavBlocks categories={categories} />

      <BestSellers products={allProducts} categories={categories} />

      <NewsletterBanner />

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
