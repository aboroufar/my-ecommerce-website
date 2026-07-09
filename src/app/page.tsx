import { getActiveProducts, getCategories } from "@/lib/products";
import { BestSellers } from "@/components/BestSellers";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SaleSection } from "@/components/SaleSection";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ProductMarquee } from "@/components/ProductMarquee";

export default async function Home() {
  const [allProducts, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <HeroSlideshow categories={categories} />

      <CategoryGrid categories={categories} products={allProducts} />

      <SaleSection products={allProducts} />

      <BestSellers products={allProducts} categories={categories} />

      <ProductMarquee products={allProducts} />
    </main>
  );
}
