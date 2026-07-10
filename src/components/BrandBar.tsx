import Link from "next/link";
import Image from "next/image";
import type { Brand } from "@/lib/brands";

/**
 * Renders admin-managed brand/partner logos. Unlike CategoryGrid, there's
 * no placeholder fallback -- a brand logo is inherently a real-world claim
 * ("we carry this brand"), so this section simply doesn't render until at
 * least one real brand exists.
 */
export function BrandBar({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  const loop = [...brands, ...brands];

  return (
    <section className="overflow-hidden border-y border-line bg-accent-soft py-10">
      <div className="flex w-max animate-marquee gap-10">
        {loop.map((brand, i) => {
          const content = (
            <>
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-background shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span className="max-w-[7rem] truncate text-xs font-medium text-foreground">
                {brand.name}
              </span>
            </>
          );

          return brand.link_url ? (
            <Link
              key={`${brand.id}-${i}`}
              href={brand.link_url}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              {content}
            </Link>
          ) : (
            <div
              key={`${brand.id}-${i}`}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
