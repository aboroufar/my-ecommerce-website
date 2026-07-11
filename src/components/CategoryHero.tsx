import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/products";

/**
 * Landing header for a top-level category's /products page: two large
 * hero photos (admin-set hero_image_url, falling back to the category's
 * own image_url twice so the layout never looks empty) plus up to two
 * "View More" cards for that category's featured groups -- the first two
 * groups with a photo set, so this needs no extra admin picker.
 */
export function CategoryHero({
  category,
  groups,
}: {
  category: Category;
  groups: Category[];
}) {
  const heroUrl = category.hero_image_url ?? category.image_url;
  if (!heroUrl) return null;

  const featuredGroups = groups.filter((g) => g.image_url).slice(0, 2);
  const eyebrow = category.hero_eyebrow || "Everything you may need";
  const headline = category.hero_headline || category.name;

  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-4">
      <HeroPanel
        href={`/products?category=${category.slug}`}
        imageUrl={heroUrl}
        eyebrow={eyebrow}
        headline={headline}
        className="sm:col-span-1"
      />
      <HeroPanel
        href={`/products?category=${category.slug}`}
        imageUrl={category.image_url ?? heroUrl}
        eyebrow={eyebrow}
        headline={headline}
        className="sm:col-span-1"
      />

      {featuredGroups.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:col-span-1 sm:grid-rows-2">
          {featuredGroups.map((group) => (
            <Link
              key={group.id}
              href={`/products?category=${group.slug}`}
              className="group relative overflow-hidden rounded-xl"
            >
              <Image
                src={group.image_url!}
                alt={group.name}
                fill
                sizes="(min-width: 640px) 12vw, 45vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute bottom-4 left-4 text-background">
                <h3 className="text-base font-bold">{group.name}</h3>
                <span className="text-xs font-medium underline underline-offset-4">
                  View More
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function HeroPanel({
  href,
  imageUrl,
  eyebrow,
  headline,
  className = "",
}: {
  href: string;
  imageUrl: string;
  eyebrow: string;
  headline: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative aspect-[4/5] overflow-hidden rounded-xl sm:aspect-auto sm:min-h-[360px] ${className}`}
    >
      <Image
        src={imageUrl}
        alt={headline}
        fill
        sizes="(min-width: 640px) 40vw, 90vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 text-background">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {eyebrow}
        </span>
        <h2 className="mt-1 font-display text-3xl font-bold">{headline}</h2>
      </div>
    </Link>
  );
}
