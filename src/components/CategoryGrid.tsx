import Link from "next/link";
import Image from "next/image";
import type { Category, ProductSummary } from "@/lib/products";

/**
 * Stock placeholder art (Unsplash, free-to-use) shown until a category has
 * a real product photo uploaded via /admin. Cycled by index rather than
 * matched to category meaning -- these are explicitly NOT real product
 * photos, just visual filler so this section isn't empty pre-launch.
 */
const placeholderImages = [
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80",
];

/**
 * One card per real category, using the first product image found in that
 * category as the card art (no dedicated category-image field exists yet).
 * Falls back to a stock placeholder photo -- clearly labeled "Sample
 * image" -- when no product in that category has a real photo uploaded
 * yet, so this section isn't blank before /admin product photos exist.
 */
export function CategoryGrid({
  categories,
  products,
}: {
  categories: Category[];
  products: ProductSummary[];
}) {
  if (categories.length === 0) return null;

  const cards = categories.map((category, i) => {
    const match = products.find(
      (p) =>
        p.product_categories.some((pc) => pc.categories?.slug === category.slug) &&
        p.product_images.length > 0
    );
    const realImage = match
      ? [...match.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]
      : null;

    return {
      category,
      url: realImage?.url ?? placeholderImages[i % placeholderImages.length],
      alt: realImage?.alt_text ?? category.name,
      isPlaceholder: !realImage,
    };
  });

  return (
    <section className="w-full px-2 pt-2 sm:px-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ category, url, alt, isPlaceholder }) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
            {isPlaceholder && (
              <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                Sample image
              </span>
            )}
            <div className="absolute bottom-4 left-4 text-background">
              <h3 className="text-lg font-bold">{category.name}</h3>
              <span className="text-sm font-medium underline underline-offset-4">
                View More
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
