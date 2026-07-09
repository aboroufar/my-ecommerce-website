import Link from "next/link";
import type { Category } from "@/lib/products";
import { SearchBox } from "./SearchBox";

export function ShopSidebar({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
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
            {categories.map((category) => (
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
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
