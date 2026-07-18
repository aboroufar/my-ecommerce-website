import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/products";

/**
 * Landing header for a top-level category's /products page: one large
 * hero photo (admin-set hero_image_url, falling back to the category's
 * own image_url) anchoring a mosaic of that category's featured groups
 * (the ones with a photo set, up to 5). The hero always occupies the left
 * half at full height; the right half is divided among 1-5 tiles using a
 * layout picked per count, so it reads as deliberate at any count instead
 * of a fixed grid with empty slots.
 */
export async function CategoryHero({
  category,
  groups,
}: {
  category: Category;
  groups: Category[];
}) {
  const heroUrl = category.hero_image_url ?? category.image_url;
  if (!heroUrl) return null;

  const t = await getTranslations("categoryHero");
  const featuredGroups = groups.filter((g) => g.image_url).slice(0, 5);
  const eyebrow = category.hero_eyebrow || t("eyebrowDefault");
  const headline = category.hero_headline || category.name;

  return (
    <section className="flex flex-col gap-2 sm:h-[480px] sm:flex-row">
      <Tile
        href={`/products?category=${category.slug}`}
        imageUrl={heroUrl}
        className="aspect-[4/5] sm:aspect-auto sm:h-full sm:w-1/2"
        textSize="lg"
      >
        <span className="text-xs font-semibold uppercase tracking-wide">
          {eyebrow}
        </span>
        <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
          {headline}
        </h2>
      </Tile>

      {featuredGroups.length > 0 && (
        <div className="flex flex-1 flex-col gap-2 sm:h-full">
          {layoutRows(featuredGroups.length).map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-1 gap-2">
              {row.map((groupIndex) => {
                const group = featuredGroups[groupIndex];
                return (
                  <Tile
                    key={group.id}
                    href={`/products?category=${group.slug}`}
                    imageUrl={group.image_url!}
                    className="aspect-square flex-1 sm:aspect-auto sm:h-full"
                    textSize="sm"
                  >
                    <h3 className="text-base font-bold">{group.name}</h3>
                    <span className="text-xs font-medium underline underline-offset-4">
                      {t("viewMore")}
                    </span>
                  </Tile>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Groups featured-tile indices into rows for the side column, varying by
 * count so 1 tile fills the whole column, 2 stack evenly, 3 goes
 * big-then-two-small, and 4-5 fill a balanced 2-row grid.
 */
function layoutRows(count: number): number[][] {
  switch (count) {
    case 1:
      return [[0]];
    case 2:
      return [[0], [1]];
    case 3:
      return [[0], [1, 2]];
    case 4:
      return [
        [0, 1],
        [2, 3],
      ];
    default:
      return [
        [0, 1, 2],
        [3, 4],
      ];
  }
}

function Tile({
  href,
  imageUrl,
  className = "",
  textSize,
  children,
}: {
  href: string;
  imageUrl: string;
  className?: string;
  textSize: "lg" | "sm";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group relative min-h-[110px] overflow-hidden ${className}`}
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        sizes="(min-width: 640px) 50vw, 90vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      <div
        className={`absolute text-background ${
          textSize === "lg" ? "bottom-6 left-6" : "bottom-3 left-3"
        }`}
      >
        {children}
      </div>
    </Link>
  );
}
