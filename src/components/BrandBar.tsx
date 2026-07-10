import Link from "next/link";
import Image from "next/image";
import type { Brand } from "@/lib/brands";

/**
 * Renders admin-managed brand/partner logos. Unlike CategoryGrid/
 * ProductMarquee, there's no placeholder fallback here -- a brand logo is
 * inherently a real-world claim ("we carry this brand"), so this section
 * simply doesn't render until at least one real brand exists.
 */
export function BrandBar({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  const loop = [...brands, ...brands];

  return (
    <section className="overflow-hidden border-y border-line bg-surface py-8">
      <div className="flex w-max animate-marquee items-center gap-16">
        {loop.map((brand, i) => {
          const logo = (
            <div className="relative h-10 w-28 shrink-0 grayscale transition-[filter] hover:grayscale-0">
              <Image
                src={brand.logo_url}
                alt={brand.name}
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>
          );
          return brand.link_url ? (
            <Link key={`${brand.id}-${i}`} href={brand.link_url}>
              {logo}
            </Link>
          ) : (
            <div key={`${brand.id}-${i}`}>{logo}</div>
          );
        })}
      </div>
    </section>
  );
}
