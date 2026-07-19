import type { Category, FilterBrand } from "@/lib/products";
import { SearchBox } from "./SearchBox";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { CategorySelect } from "./CategorySelect";
import { BrandDropdown } from "./BrandDropdown";
import { GenderDropdown } from "./GenderDropdown";

export function ShopSidebar({
  categories,
  activeSlug,
  maxPrice,
  maxPriceCents,
  brands,
  activeBrandId,
  showGender,
  activeGender,
}: {
  categories: Category[];
  activeSlug?: string;
  maxPrice?: string;
  // Upper bound of the catalog's active-product prices, in cents -- powers
  // the price slider's own range. 0 hides the slider (no active products).
  maxPriceCents: number;
  // Brand/gender sections are optional: omitting `brands` (or passing an
  // empty list) hides the Brand section, and `showGender` defaulting to
  // false hides Gender -- this lets /promo reuse this sidebar without
  // carrying filter dimensions it doesn't want (its own filtering is
  // still just category + price).
  brands?: FilterBrand[];
  activeBrandId?: string;
  showGender?: boolean;
  activeGender?: string;
}) {
  return (
    <aside className="w-full shrink-0 rounded-lg bg-surface p-6 lg:w-72">
      <SearchBox />

      <PriceRangeSlider maxPriceCents={maxPriceCents} currentMaxPrice={maxPrice} />

      <CategorySelect categories={categories} activeSlug={activeSlug} />

      {brands && brands.length > 0 && (
        <BrandDropdown brands={brands} activeBrandId={activeBrandId} />
      )}

      {showGender && <GenderDropdown activeGender={activeGender} />}
    </aside>
  );
}
