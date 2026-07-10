import { getActiveProducts, getCategories } from "@/lib/products";
import { getHeroSlides } from "@/lib/heroSlides";
import { getHomepageSections, type HomepageSectionKey } from "@/lib/homepageSections";
import { getBrands } from "@/lib/brands";
import { BestSellers } from "@/components/BestSellers";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SaleSection } from "@/components/SaleSection";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { BrandBar } from "@/components/BrandBar";

export default async function Home() {
  const [allProducts, allCategories, heroSlides, sections, brands] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getHeroSlides(),
    getHomepageSections(),
    getBrands(),
  ]);

  // The homepage category grid and bestseller filters are meant to
  // showcase top-level departments (Skincare, Apparel, ...), not every
  // group/product-line underneath them.
  const categories = allCategories.filter((c) => !c.parent_id);

  const sectionComponents: Record<HomepageSectionKey, React.ReactNode> = {
    hero: <HeroSlideshow slides={heroSlides} />,
    category_grid: <CategoryGrid categories={categories} products={allProducts} />,
    sale: <SaleSection products={allProducts} />,
    best_sellers: <BestSellers products={allProducts} categories={categories} />,
    brand_bar: <BrandBar brands={brands} />,
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
