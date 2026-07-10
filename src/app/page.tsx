import { getActiveProducts, getCategories } from "@/lib/products";
import { getHeroSlides } from "@/lib/heroSlides";
import { getHomepageSections, type HomepageSectionKey } from "@/lib/homepageSections";
import { getBrands } from "@/lib/brands";
import { BestSellers } from "@/components/BestSellers";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SaleSection } from "@/components/SaleSection";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ProductMarquee } from "@/components/ProductMarquee";
import { BrandBar } from "@/components/BrandBar";

export default async function Home() {
  const [allProducts, categories, heroSlides, sections, brands] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getHeroSlides(),
    getHomepageSections(),
    getBrands(),
  ]);

  const sectionComponents: Record<HomepageSectionKey, React.ReactNode> = {
    hero: <HeroSlideshow slides={heroSlides} />,
    category_grid: <CategoryGrid categories={categories} products={allProducts} />,
    sale: <SaleSection products={allProducts} />,
    best_sellers: <BestSellers products={allProducts} categories={categories} />,
    brand_bar: <BrandBar brands={brands} />,
    product_marquee: <ProductMarquee products={allProducts} />,
  };

  return (
    <main className="flex flex-1 flex-col">
      {sections
        .filter((section) => section.enabled)
        .map((section) => (
          <div key={section.key}>{sectionComponents[section.key]}</div>
        ))}
    </main>
  );
}
