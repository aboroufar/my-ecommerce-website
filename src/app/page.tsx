import { getActiveProducts, getCategories } from "@/lib/products";
import { getHeroSlides } from "@/lib/heroSlides";
import { BestSellers } from "@/components/BestSellers";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SaleSection } from "@/components/SaleSection";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ProductMarquee } from "@/components/ProductMarquee";

export default async function Home() {
  const [allProducts, categories, heroSlides] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getHeroSlides(),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <HeroSlideshow slides={heroSlides} />

      <CategoryGrid categories={categories} products={allProducts} />

      <SaleSection products={allProducts} />

      <BestSellers products={allProducts} categories={categories} />

      <ProductMarquee products={allProducts} />
    </main>
  );
}
