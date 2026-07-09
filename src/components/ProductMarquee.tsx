import Link from "next/link";
import Image from "next/image";
import type { ProductSummary } from "@/lib/products";

/**
 * Stock placeholder art (Unsplash, free-to-use) for products with no
 * uploaded photo yet, same pattern as CategoryGrid/HeroSlideshow. Distinct
 * pool so nothing repeats across sections.
 */
const placeholderImages = [
  "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400&q=80",
  "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&q=80",
  "https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=400&q=80",
  "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
];

/**
 * Auto-scrolling strip of real catalog products (photo + name), continuous
 * marquee. Replaces the reference site's fake partner-brand logo strip --
 * we don't have partner brands, so this shows our own products instead.
 */
export function ProductMarquee({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  const items = products.map((product, i) => {
    const image = [...product.product_images].sort(
      (a, b) => a.sort_order - b.sort_order
    )[0];
    return {
      product,
      url: image?.url ?? placeholderImages[i % placeholderImages.length],
      alt: image?.alt_text ?? product.name,
      isPlaceholder: !image,
    };
  });

  // Duplicate the list so the CSS scroll animation can loop seamlessly.
  const loop = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-line bg-accent-soft py-10">
      <div className="flex w-max animate-marquee gap-10">
        {loop.map((item, i) => (
          <Link
            key={`${item.product.id}-${i}`}
            href={`/products/${item.product.slug}`}
            className="flex shrink-0 flex-col items-center gap-2"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-background">
              <Image
                src={item.url}
                alt={item.alt}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <span className="max-w-[7rem] truncate text-xs font-medium text-foreground">
              {item.product.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
