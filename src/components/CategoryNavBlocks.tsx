import Link from "next/link";
import type { Category } from "@/lib/products";

/**
 * One block per real category, linking to that category's filtered view
 * plus its available sort orders. The reference design nests a nine-item
 * sub-taxonomy (Vitamins, Toy Set, Gift, ...) under each block, but this
 * store's schema has no sub-category/tag data to back that -- inventing
 * one would just be fake links, so each block instead links to real,
 * distinct product-listing views for that category.
 */
export function CategoryNavBlocks({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  const sortLinks = [
    { label: "Newest", sort: "newest" },
    { label: "Price: Low to High", sort: "price-asc" },
    { label: "Price: High to Low", sort: "price-desc" },
    { label: "Name: A to Z", sort: "name-asc" },
  ];

  return (
    <section className="border-y border-line bg-surface px-6 py-16 sm:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <div key={category.id}>
            <Link
              href={`/products?category=${category.slug}`}
              className="inline-block rounded-md bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90"
            >
              {category.name}
            </Link>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {sortLinks.map((link) => (
                <li key={link.sort}>
                  <Link
                    href={`/products?category=${category.slug}&sort=${link.sort}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
