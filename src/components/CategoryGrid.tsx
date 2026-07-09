import Link from "next/link";
import Image from "next/image";
import type { Category, ProductSummary } from "@/lib/products";

/**
 * One card per real category, using the first product image found in that
 * category as the card art (no dedicated category-image field exists yet).
 * Categories with no product images are skipped rather than shown blank.
 */
export function CategoryGrid({
  categories,
  products,
}: {
  categories: Category[];
  products: ProductSummary[];
}) {
  const cards = categories
    .map((category) => {
      const match = products.find(
        (p) =>
          p.product_categories.some((pc) => pc.categories?.slug === category.slug) &&
          p.product_images.length > 0
      );
      const image = match
        ? [...match.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]
        : null;
      return { category, image };
    })
    .filter((card) => card.image !== null);

  if (cards.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ category, image }) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl"
          >
            <Image
              src={image!.url}
              alt={image!.alt_text ?? category.name}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-background">
              <h3 className="text-base font-bold">{category.name}</h3>
              <span className="text-xs font-medium underline underline-offset-4">
                View More
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
