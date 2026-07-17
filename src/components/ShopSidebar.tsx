import Link from "next/link";
import type { Category } from "@/lib/products";
import { SearchBox } from "./SearchBox";
import { PriceRangeFilter } from "./PriceRangeFilter";

export function ShopSidebar({
  categories,
  activeSlug,
  minPrice,
  maxPrice,
}: {
  categories: Category[];
  activeSlug?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const renderTree = (list: Category[], depth: number) => (
    <ul className={depth === 0 ? "mt-3 space-y-2 text-sm" : "mt-1.5 space-y-1.5 border-l border-line pl-3"}>
      {list.map((category) => (
        <li key={category.id}>
          <Link
            href={`/products?category=${category.slug}`}
            className={`transition-colors hover:text-foreground ${
              activeSlug === category.slug
                ? "font-semibold text-foreground"
                : "text-muted"
            }`}
          >
            {category.name}
          </Link>
          {(childrenByParent.get(category.id) ?? []).length > 0 &&
            renderTree(childrenByParent.get(category.id)!, depth + 1)}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="w-full shrink-0 rounded-lg bg-surface p-6 lg:w-64">
      <SearchBox />

      {categories.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-base font-bold text-foreground">
            Categories
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/products"
                className={`transition-colors hover:text-foreground ${
                  !activeSlug ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                All products
              </Link>
            </li>
          </ul>
          {renderTree(topLevel, 0)}
        </div>
      )}

      <PriceRangeFilter minPrice={minPrice} maxPrice={maxPrice} />
    </aside>
  );
}
