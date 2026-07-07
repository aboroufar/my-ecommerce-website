import Link from "next/link";
import Image from "next/image";
import type { ProductSummary } from "@/lib/products";
import { PriceTag } from "./PriceTag";

export function ProductCard({ product }: { product: ProductSummary }) {
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-accent-soft">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt_text ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-2xl text-accent/40">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        <PriceTag
          cents={product.price_cents}
          currency={product.currency}
          className="absolute right-3 top-3"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-sm text-foreground">{product.name}</h3>
      </div>
    </Link>
  );
}
